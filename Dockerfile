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

EXPOSE 8069 8072

CMD ["python", "odoo-bin", \
     "--addons-path=/odoo/addons,/custom_addons", \
     "--db_host=db", "--db_user=odoo", "--db_password=odoo"]
