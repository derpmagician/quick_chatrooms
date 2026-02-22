CREATE DATABASE IF NOT EXISTS chatdb;

-- crea el usuario y dale una contraseña cualquiera (chatpass aquí):
CREATE USER IF NOT EXISTS 'chat'@'localhost' IDENTIFIED BY 'chatpass';

-- permite al usuario hacer todo sobre la base de datos que acabas de crear
GRANT ALL PRIVILEGES ON chatdb.* TO 'chat'@'localhost';

-- además concede permisos globales necesarios para la shadow database
GRANT ALL PRIVILEGES ON *.* TO 'chat'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;
