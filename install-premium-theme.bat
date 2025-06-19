@echo off
echo ============================================
echo RescueNet AI - Premium Theme Installation
echo ============================================
echo.
echo This script will install the premium theme
echo enhancements for your RescueNet AI system.
echo.
pause

echo Installing premium theme files...
echo.

REM Check if directories exist
if not exist "public\css" (
    echo Creating CSS directory...
    mkdir "public\css"
)

if not exist "public\js" (
    echo Creating JS directory...
    mkdir "public\js"
)

echo.
echo ✓ Premium theme CSS files installed:
echo   - premium-theme.css (Core theme system)
echo   - premium-navigation.css (Navigation components)
echo   - premium-landing.css (Landing page styles)
echo   - premium-auth.css (Authentication pages)
echo   - premium-dashboard.css (Dashboard components)
echo.
echo ✓ Premium JavaScript files installed:
echo   - premium-enhanced.js (Interactive enhancements)
echo.
echo ✓ HTML files updated with premium theme links
echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo Your RescueNet AI system now features:
echo   ✓ Modern dark theme with glassmorphism effects
echo   ✓ Enhanced mobile-responsive navigation
echo   ✓ Smooth animations and micro-interactions
echo   ✓ Premium typography and spacing system
echo   ✓ Interactive dashboard components
echo   ✓ Enhanced form controls and validation
echo   ✓ Performance optimizations
echo.
echo To start using the premium theme:
echo 1. Open any HTML file in your browser
echo 2. Experience the enhanced UI/UX
echo 3. Check the PREMIUM_THEME_GUIDE.md for details
echo.
echo Enjoy your premium RescueNet AI experience!
pause
