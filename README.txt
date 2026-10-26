SISTEMA DE CITAS LMH — GUARDADO EN GOOGLE DRIVE
================================================

Esta versión registra las solicitudes en una hoja de cálculo de Google Drive y envía
un correo de aviso a 2021120488@lmh.edu.hn.

IMPORTANTE
----------
No basta con colocar un correo en el código. Debe conectar el formulario con un
proyecto de Google Apps Script y autorizarlo desde la cuenta de Google que administrará
las solicitudes. La hoja se crea en el Drive de esa cuenta. El correo de administración
recibe un aviso con los datos y un enlace a la hoja.

ARCHIVOS
--------
index.html       Formulario del sistema.
estilos.css      Diseño adaptable en tonos verdes.
script.js        Validación y envío a Google Apps Script.
Code.gs          Código que guarda datos en Google Sheets y manda el aviso.
imagenes/        Coloque aquí su fotografía opcional con nombre fondo-liceo.jpg.
INSTRUCCIONES_GOOGLE_DRIVE.txt  Guía detallada.

FOTOGRAFÍA DE FONDO
-------------------
Copie su foto JPG en la carpeta imagenes y nómbrela fondo-liceo.jpg.
Si no coloca una foto, el sistema mantiene el fondo verde.

PUBLICACIÓN
-----------
Puede alojar la parte web en un servicio estático (por ejemplo, GitHub Pages) porque
la recepción de datos se realiza en Google Apps Script. Debe publicar también la web
y configurar la URL /exec de la aplicación de Apps Script en script.js.
No publique claves ni contraseñas. La hoja contiene datos personales: mantenga el
acceso restringido al personal autorizado.
