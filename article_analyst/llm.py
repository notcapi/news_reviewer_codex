from __future__ import annotations

import os
from typing import Any, Dict, Iterable, List, Optional, Union

import requests
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


DEFAULT_BASE_URL = "https://api.llamafarm.ai/v1/chat/completions"


def _message_to_dict(message: BaseMessage) -> Dict[str, Any]:
    content = message.content
    if isinstance(content, list):
        content = [
            part if isinstance(part, dict) else {"type": "text", "text": str(part)}
            for part in content
        ]
    role_aliases = {
        "human": "user",
        "ai": "assistant",
        "system": "system",
        "tool": "tool",
        "function": "function",
    }
    role = role_aliases.get(message.type, message.type)
    return {"role": role, "content": content}


class TransientRequestError(RuntimeError):
    """Error transitorio al invocar LlamaFarm, apto para reintentos automáticos."""


class LlamaFarmChatModel(BaseChatModel):
    """Adaptador sencillo para consumir el endpoint OpenAI-like de LlamaFarm."""

    def __init__(
        self,
        model: str,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0,
        max_tokens: Optional[int] = None,
        timeout: int = 120,
        extra_headers: Optional[Dict[str, str]] = None,
        verify: Optional[Union[bool, str]] = None,
        api_version: Optional[str] = None,
        force_json: Optional[bool] = None,
    ) -> None:
        super().__init__()
        object.__setattr__(self, "_model_id", model)
        api_token = api_key or os.environ.get("LLAMAFARM_API_KEY")
        if not api_token:
            raise ValueError(
                "No se encontró LLAMAFARM_API_KEY. Configura la variable de entorno o pásala al constructor."
            )
        object.__setattr__(self, "api_key", api_token)
        object.__setattr__(self, "base_url", self._resolve_base_url(base_url))
        object.__setattr__(self, "temperature", temperature)
        object.__setattr__(self, "max_tokens", max_tokens)
        object.__setattr__(self, "timeout", timeout)
        object.__setattr__(self, "extra_headers", extra_headers or {})
        object.__setattr__(self, "verify", self._resolve_verify_option(verify))
        object.__setattr__(self, "api_version", api_version or os.environ.get("LLAMAFARM_API_VERSION"))
        object.__setattr__(self, "force_json", self._resolve_force_json(force_json))

    @property
    def _default_params(self) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "model": self._model_id,
            "temperature": self.temperature,
        }
        if self.max_tokens is not None:
            params["max_tokens"] = self.max_tokens
        if self.force_json:
            params["response_format"] = {"type": "json_object"}
        return params

    @property
    def _llm_type(self) -> str:
        return "llamafarm-chat"

    def _resolve_verify_option(self, explicit: Optional[Union[bool, str]]) -> Union[bool, str]:
        """Determina la configuración de verificación SSL a usar con requests."""
        if explicit is not None:
            return explicit

        ca_bundle = os.environ.get("LLAMAFARM_CA_BUNDLE")
        if ca_bundle:
            return ca_bundle

        verify_env = os.environ.get("LLAMAFARM_VERIFY_SSL")
        if verify_env is not None:
            flag = verify_env.strip().lower()
            if flag in {"0", "false", "no"}:
                return False
            if flag in {"1", "true", "yes"}:
                return True

        return True

    def _resolve_base_url(self, explicit: Optional[str]) -> str:
        if explicit:
            return explicit
        env_base = os.environ.get("LLAMAFARM_BASE_URL")
        if env_base:
            return env_base
        return DEFAULT_BASE_URL

    def _resolve_force_json(self, explicit: Optional[bool]) -> bool:
        if explicit is not None:
            return explicit
        env_force = os.environ.get("LLAMAFARM_FORCE_JSON")
        if env_force is None:
            return False
        flag = env_force.strip().lower()
        if flag in {"1", "true", "yes"}:
            return True
        if flag in {"0", "false", "no"}:
            return False
        return False

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(TransientRequestError),
        reraise=True,
    )
    def _request_completion(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            **self.extra_headers,
        }
        if self.api_version:
            headers.setdefault("X-API-Version", self.api_version)
        try:
            response = requests.post(
                self.base_url,
                json=payload,
                headers=headers,
                timeout=self.timeout,
                verify=self.verify,
            )
        except requests.exceptions.SSLError as exc:
            raise RuntimeError(
                "No se pudo establecer una conexión SSL con LlamaFarm. "
                "Verifica tus certificados del sistema o exporta LLAMAFARM_CA_BUNDLE con la ruta del certificado. "
                "Como último recurso, puedes desactivar temporalmente la verificación usando LLAMAFARM_VERIFY_SSL=0."
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise TransientRequestError(f"Fallo de red al llamar a LlamaFarm: {exc}") from exc

        if response.status_code >= 400:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise RuntimeError(f"Error LlamaFarm ({response.status_code}): {detail}")
        return response.json()

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[Iterable[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        payload: Dict[str, Any] = {**self._default_params, **kwargs}
        payload["messages"] = [_message_to_dict(message) for message in messages]

        if stop:
            payload["stop"] = list(stop)

        raw_response = self._request_completion(payload)

        try:
            content = raw_response["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError(f"Respuesta inesperada de LlamaFarm: {raw_response}") from exc

        ai_message = AIMessage(content=content, additional_kwargs={"raw": raw_response})
        generation = ChatGeneration(message=ai_message, text=content)
        return ChatResult(generations=[generation], llm_output=raw_response)
