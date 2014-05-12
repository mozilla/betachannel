CREATE DATABASE betafox CHARACTER SET utf8 COLLATE utf8_general_ci;
USE betafox;

CREATE TABLE `user` (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  UNIQUE KEY(email),
  PRIMARY KEY(id)
);

CREATE TABLE `app` (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(254) NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY(code),
  FOREIGN KEY(user_id) REFERENCES user(id),
  PRIMARY KEY(id)
);

CREATE TABLE version (
  id INT NOT NULL AUTO_INCREMENT,
  version VARCHAR(20) NOT NULL,
  icon_location VARCHAR(5000) NOT NULL,
  signed_package_location VARCHAR(5000),
  signed_package_size INT,
  manifest TEXT NOT NULL,
  create_dt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  app_id INT NOT NULL,
  FOREIGN KEY(app_id) REFERENCES app(id),
  PRIMARY KEY(id)
);





