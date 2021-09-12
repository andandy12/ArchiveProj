@echo off
echo. && echo Checking if node.js is installed && echo.
call node -v
if errorlevel 1 echo. && echo You must have node.js installed, install from https://nodejs.org/en/ && goto :EOF
echo. && echo Checking if npm is installed && echo.
call npm -v
if errorlevel 1 echo. && echo You must have node package manager installed, install from https://docs.npmjs.com/downloading-and-installing-node-js-and-npm && goto :EOF
echo. && echo Installing all dependencies && echo.
call npm i
call npm run test
pause