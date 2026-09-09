# Imagen de desarrollo para correr Odoo desde el código fuente clonado (rama 19.0)
FROM python:3.12-slim-bookworm

# Dependencias de sistema necesarias para compilar/ejecutar los paquetes de requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg-dev \
    zlib1g-dev \
    libsasl2-dev \
    libldap2-dev \
    libssl-dev \
    libffi-dev \
    node-less \
    npm \
    wkhtmltopdf \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g rtlcss

WORKDIR /odoo

# Instalamos primero los requirements para aprovechar el cache de capas de Docker
COPY odoo/requirements.txt /odoo/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# El código de Odoo se copia a la imagen (en vez de montarse desde Windows
# como bind mount en docker-compose.yml, como era antes) -- encontrado el
# 09/09/2026, investigando por qué el backend se sentía lento: un bind mount
# de Windows hacia el contenedor via Docker Desktop es ~20 veces más lento
# por archivo que el propio disco del contenedor (medido recorriendo esta
# misma carpeta, 50 mil archivos, de las dos formas). Reiniciar Odoo o
# actualizar el módulo -- cosas que este proyecto hace todo el tiempo --
# implica que Odoo recorra buena parte de esa carpeta para armar el
# registro de los 100+ módulos instalados, así que ese montaje lento pegaba
# en cada reinicio, no solo al levantar el contenedor por primera vez.
# Se copia DESPUÉS de instalar los requirements para no invalidar esa capa
# (que no cambia case así) cada vez que cambia el código -- ver .dockerignore
# para lo que se excluye de esta copia (el historial de git de Odoo, sobre
# todo, que no hace falta adentro de la imagen y pesa cientos de MB).
#
# OJO si en algún momento hace falta tocar un archivo del CORE de Odoo (no
# de custom_addons, que sigue con bind mount y edición en vivo en
# docker-compose.yml): un cambio acá ya no se refleja solo, hace falta
# reconstruir la imagen (`docker compose build odoo`). Hoy este proyecto
# nunca edita el core, así que no debería ser un problema en la práctica.
COPY odoo/ /odoo/

EXPOSE 8069 8072

# --data-dir apunta al volumen persistente (odoo-web-data, montado en
# /var/lib/odoo por docker-compose.yml) -- ANTES no estaba, así que Odoo
# usaba su ubicación por defecto ($HOME/.local/share/Odoo), que vive en la
# capa descartable del contenedor, no en el volumen. El volumen ya estaba
# declarado y montado, pero nunca conectado de verdad -- quedó así sin que
# nadie lo notara porque `docker compose restart` (lo que se usa siempre
# para aplicar cambios de .py) reutiliza el mismo contenedor, así que la
# capa descartable sobrevivía de restart en restart. Recién se notó el
# 09/09/2026, al recrear el contenedor con la imagen nueva (ver el comentario
# de COPY odoo/ más arriba): se perdió el filestore entero (imágenes de
# producto, logo, adjuntos) porque nunca había estado en el volumen. Con
# esto, un `docker compose down` / recrear el contenedor / reconstruir la
# imagen ya no borra nada -- el filestore sobrevive en el volumen con
# nombre, sea cual sea el contenedor que lo use.
CMD ["python", "odoo-bin", \
     "--addons-path=/odoo/addons,/custom_addons", \
     "--data-dir=/var/lib/odoo", \
     "--db_host=db", "--db_user=odoo", "--db_password=odoo"]
