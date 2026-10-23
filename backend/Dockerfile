FROM node:22-bookworm-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY requirements.txt ./
RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHON_EXECUTABLE=/opt/venv/bin/python
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]