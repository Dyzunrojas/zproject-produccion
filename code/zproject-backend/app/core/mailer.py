import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def sendEmail(to: str, subject: str, body: str) -> str | None:
    """Envía un correo de texto.

    Devuelve None si se envió, o un mensaje de aviso si no se pudo
    (nunca lanza error: el correo no debe romper la operación principal).
    """
    if not settings.smtpHost:
        logger.info("Correo no configurado. Para: %s | %s\n%s", to, subject, body)
        return "El servidor de correo no está configurado: no se envió el aviso al cliente"

    message = EmailMessage()
    message["From"] = settings.smtpFrom or settings.smtpUser
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtpHost, settings.smtpPort, timeout=5) as server:
            server.starttls()
            if settings.smtpUser:
                server.login(settings.smtpUser, settings.smtpPassword)
            server.send_message(message)
    except Exception as error:  # cualquier fallo (red, login, codificación) se convierte en aviso
        logger.error("No se pudo enviar el correo a %s: %s", to, error)
        return "No se pudo enviar el correo al cliente"

    return None