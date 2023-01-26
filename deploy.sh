#!/bin/bash
# -*- ENCODING: UTF-8 -*-

read -p "Nombre de la App: " app
read -p "Dominio: " dominio
cat > ${app}.com <<EOF
# /etc/nginx/sites-available/$app

server {
    server_name $dominio www.${dominio};

    location = /favicon.ico { 
        access_log off; 
        log_not_found off; 
        }

    location /static/ {
        autoindex on;
        alias $PWD/staticfiles/;
        }
    
    location /media/ {
        autoindex on;
        alias $PWD/media/;
        }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/${app}.sock;
    }
}
EOF

cat > ${app}.socket <<EOF
# /etc/systemd/system/$app.socket

[Unit]
Description=$app socket

[Socket]
ListenStream=/run/$app.sock

[Install]
WantedBy=sockets.targetEOF
EOF

cat > ${app}.service <<EOF
# /etc/systemd/system/$app.service

[Unit]
Description=$app daemon
Requires=$app.socket
After=network.target

[Service]
User=gonzalo
Group=www-data
WorkingDirectory=$PWD
ExecStart=$PWD/.venv/bin/gunicorn \
    --access-logfile - \
    --workers 3 \
    --bind unix:/run/$app.sock \
    main.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

sudo cp $app.socket /etc/systemd/system/$app.socket
sudo cp $app.service /etc/systemd/system/$app.service
sudo systemctl enable $app
sudo systemctl start $app
sudo systemctl status $app

sudo cp $app.com /etc/nginx/sites-available/$app.com
sudo ln -s /etc/nginx/sites-available/$app.com /etc/nginx/sites-enabled/$app.com
nginx -t

exit


