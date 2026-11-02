from app.core.mailer import sendEmail
from app.modules.order.models import Order


def notifyOrderFinished(order: Order, *, kind: str, subject: str, summary: str) -> str | None:
    """Avisa por correo al cliente que su pedido (de cualquier tipo) quedo terminado.

    Lo usan los pedidos 3D y las reparaciones: cada uno solo aporta su `summary`
    (que se termino) y `kind` ("pedido" o "reparación"); el saludo, el numero, la
    fecha de entrega, la validacion del correo y el envio son iguales para todos.

    Devuelve None si se envio, o un aviso si no se pudo (el pedido ya esta guardado,
    asi que un fallo del correo nunca debe deshacerlo).
    """
    client = order.client
    if not client.email:
        return "El cliente no tiene correo registrado"

    body = (
        f"Hola {client.name},\n\n"
        f"{summary}\n"
        f"Número de {kind}: #{order.id}\n"
        f"Fecha de entrega: {order.deliveryDate:%d/%m/%Y}\n\n"
        "¡Gracias por tu preferencia!"
    )
    return sendEmail(client.email, subject, body)
