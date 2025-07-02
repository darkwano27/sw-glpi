@echo off
echo Iniciando servidor backend con configuracion para headers grandes...
set NODE_OPTIONS=--max-http-header-size=16384
nodemon index.js
