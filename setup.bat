@echo off
setlocal
echo === Saral Watch Setup ===
call npm install || exit /b 1
call npm run build || exit /b 1
call npm --workspace server run db:push || exit /b 1
call npm run seed || exit /b 1
echo === Setup complete. Run: npm start ===
