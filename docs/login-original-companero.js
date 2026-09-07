/**
 * ============================================================================
 * SISTEMA DE AUTENTICACIÓN Y VALIDACIÓN · CAMPUS VIRTUAL ACADÉMICO (login.js)
 * Conforme a las directrices de diseño.md y accesibilidad WCAG 2.1 AA/AAA
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. CONSTANTES, SELECTORES Y ESTADO DE LA APLICACIÓN
  // --------------------------------------------------------------------------
  const STORAGE_KEY_EMAIL = 'aetheria_saved_email';

  // Elementos de Pestañas de Modo (Login / Registro)
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');
  const linkSwitchToRegister = document.getElementById('link-switch-to-register');
  const linkSwitchToLogin = document.getElementById('link-switch-to-login');

  // Formulario de Inicio de Sesión
  const formLogin = document.getElementById('form-login');
  const inputLoginEmail = document.getElementById('login-email');
  const inputLoginPassword = document.getElementById('login-password');
  const checkRememberEmail = document.getElementById('login-remember-email');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const btnToggleLoginPassword = document.getElementById('login-password-toggle');

  // Formulario de Registro
  const formRegister = document.getElementById('form-register');
  const inputRegisterName = document.getElementById('register-name');
  const inputRegisterEmail = document.getElementById('register-email');
  const selectRegisterRole = document.getElementById('register-role');
  const inputRegisterPassword = document.getElementById('register-password');
  const checkRegisterTerms = document.getElementById('register-terms');
  const btnSubmitRegister = document.getElementById('btn-submit-register');
  const btnToggleRegisterPassword = document.getElementById('register-password-toggle');
  const passwordStrengthContainer = document.getElementById('register-password-strength');
  const strengthText = document.getElementById('strength-text');

  // Modal de Recuperación de Contraseña
  const modalForgotPassword = document.getElementById('modal-forgot-password');
  const btnTriggerForgotPassword = document.getElementById('btn-forgot-password-trigger');
  const btnCloseModalForgot = document.getElementById('modal-forgot-close');
  const btnCancelModalForgot = document.getElementById('modal-forgot-cancel');
  const formForgotPassword = document.getElementById('form-forgot-password');
  const inputForgotEmail = document.getElementById('forgot-email');
  const btnSubmitForgot = document.getElementById('btn-submit-forgot');
  const modalForgotViewForm = document.getElementById('modal-forgot-view-form');
  const modalForgotViewSuccess = document.getElementById('modal-forgot-view-success');
  const modalForgotDoneBtn = document.getElementById('modal-forgot-done-btn');
  const forgotConfirmedEmail = document.getElementById('forgot-confirmed-email');
  const forgotCountdownTimer = document.getElementById('forgot-countdown-timer');

  // Botones SSO
  const btnSsoGoogle = document.getElementById('btn-sso-google');
  const btnSsoMicrosoft = document.getElementById('btn-sso-microsoft');

  // Contenedor de Toasts
  const toastRegion = document.getElementById('toast-region');

  let countdownInterval = null;
  let lastFocusedElementBeforeModal = null;

  // --------------------------------------------------------------------------
  // 2. UTILIDADES DE VALIDACIÓN
  // --------------------------------------------------------------------------

  /**
   * Expresión regular para validar formato de correo electrónico
   * Cumple con estructura usuario@dominio.tld
   */
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Valida una dirección de correo y retorna mensaje de error o null si es válido
   * @param {string} email 
   * @returns {string|null}
   */
  function validateEmail(email) {
    const trimmed = email.trim();
    if (!trimmed) {
      return 'Por favor ingresa tu correo electrónico.';
    }
    if (!trimmed.includes('@')) {
      return 'El correo debe contener el símbolo "@" (ej. usuario@institucion.edu).';
    }
    const parts = trimmed.split('@');
    if (parts.length > 2 || !parts[1]) {
      return 'El dominio del correo está incompleto.';
    }
    if (!parts[1].includes('.')) {
      return 'El dominio debe incluir una extensión válida (ej. .edu, .org, .com).';
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Ingresa un correo electrónico con formato válido.';
    }
    return null;
  }

  /**
   * Asigna el estado visual y mensaje de error a un grupo de formulario
   * @param {HTMLElement} inputElement 
   * @param {string|null} errorMessage 
   */
  function setFieldState(inputElement, errorMessage) {
    const group = inputElement.closest('.form-group');
    if (!group) return;

    let errorElement = group.querySelector('.form-feedback-msg');

    if (errorMessage) {
      group.classList.add('has-error');
      group.classList.remove('has-success');
      inputElement.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
    } else {
      group.classList.remove('has-error');
      group.classList.add('has-success');
      inputElement.removeAttribute('aria-invalid');
      if (errorElement) {
        errorElement.textContent = '';
      }
    }
  }

  /**
   * Limpia el estado de validación de un campo
   * @param {HTMLElement} inputElement 
   */
  function clearFieldState(inputElement) {
    const group = inputElement.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error', 'has-success');
    inputElement.removeAttribute('aria-invalid');
    const errorElement = group.querySelector('.form-feedback-msg');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Calcula la robustez de la contraseña
   * @param {string} password 
   * @returns {{ score: number, label: string, className: string }}
   */
  function evaluatePasswordStrength(password) {
    if (!password) {
      return { score: 0, label: 'Seguridad: Ingresa una contraseña', className: '' };
    }

    let score = 0;
    const length = password.length;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Normalizar a escala de 1 a 4
    if (score <= 1) {
      return { score: 1, label: 'Seguridad: Muy débil (mínimo 8 caracteres)', className: 'strength-weak' };
    } else if (score === 2) {
      return { score: 2, label: 'Seguridad: Aceptable (agrega mayúsculas y números)', className: 'strength-medium' };
    } else if (score === 3 || score === 4) {
      return { score: 3, label: 'Seguridad: Buena (recomendada para cuentas académicas)', className: 'strength-good' };
    } else {
      return { score: 4, label: 'Seguridad: Excelente y robusta', className: 'strength-strong' };
    }
  }

  // --------------------------------------------------------------------------
  // 3. ALTERNANCIA DE VISIBILIDAD DE CONTRASEÑA
  // --------------------------------------------------------------------------
  function setupPasswordToggle(inputElement, toggleButton) {
    if (!inputElement || !toggleButton) return;

    toggleButton.addEventListener('click', () => {
      const isPassword = inputElement.type === 'password';
      inputElement.type = isPassword ? 'text' : 'password';

      const iconOpen = toggleButton.querySelector('.icon-eye-open');
      const iconClosed = toggleButton.querySelector('.icon-eye-closed');

      if (isPassword) {
        iconOpen?.classList.add('hidden');
        iconClosed?.classList.remove('hidden');
        toggleButton.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        iconOpen?.classList.remove('hidden');
        iconClosed?.classList.add('hidden');
        toggleButton.setAttribute('aria-label', 'Mostrar contraseña');
      }

      // Mantener el foco en el input para no romper el flujo
      inputElement.focus();
    });
  }

  setupPasswordToggle(inputLoginPassword, btnToggleLoginPassword);
  setupPasswordToggle(inputRegisterPassword, btnToggleRegisterPassword);

  // --------------------------------------------------------------------------
  // 4. CAMBIO DE PESTAÑAS (INICIAR SESIÓN / CREAR CUENTA)
  // --------------------------------------------------------------------------
  function switchTab(mode) {
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabLogin.setAttribute('tabindex', '0');

      tabRegister.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'false');
      tabRegister.setAttribute('tabindex', '-1');

      panelLogin.classList.remove('hidden');
      panelRegister.classList.add('hidden');

      setTimeout(() => inputLoginEmail?.focus(), 50);
    } else if (mode === 'register') {
      tabRegister.classList.add('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabRegister.setAttribute('tabindex', '0');

      tabLogin.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'false');
      tabLogin.setAttribute('tabindex', '-1');

      panelRegister.classList.remove('hidden');
      panelLogin.classList.add('hidden');

      setTimeout(() => inputRegisterName?.focus(), 50);
    }
  }

  tabLogin?.addEventListener('click', () => switchTab('login'));
  tabRegister?.addEventListener('click', () => switchTab('register'));
  linkSwitchToRegister?.addEventListener('click', () => switchTab('register'));
  linkSwitchToLogin?.addEventListener('click', () => switchTab('login'));

  // Soporte de navegación con flechas en las pestañas (Accesibilidad WAI-ARIA)
  [tabLogin, tabRegister].forEach(tab => {
    tab?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const targetTab = tab === tabLogin ? 'register' : 'login';
        switchTab(targetTab);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. EVALUADOR EN VIVO DE FORTALEZA DE CONTRASEÑA EN REGISTRO
  // --------------------------------------------------------------------------
  inputRegisterPassword?.addEventListener('input', () => {
    const val = inputRegisterPassword.value;
    const strength = evaluatePasswordStrength(val);

    passwordStrengthContainer.className = `password-strength-container ${strength.className}`;
    if (strengthText) {
      strengthText.textContent = strength.label;
    }

    if (val.length >= 8) {
      setFieldState(inputRegisterPassword, null);
    }
  });

  // --------------------------------------------------------------------------
  // 6. VALIDACIONES EN VIVO DE CORREOS
  // --------------------------------------------------------------------------
  inputLoginEmail?.addEventListener('input', () => {
    if (inputLoginEmail.value.trim().length > 0) {
      const err = validateEmail(inputLoginEmail.value);
      if (!err) {
        setFieldState(inputLoginEmail, null);
      }
    } else {
      clearFieldState(inputLoginEmail);
    }
  });

  inputLoginEmail?.addEventListener('blur', () => {
    if (inputLoginEmail.value.trim().length > 0) {
      const err = validateEmail(inputLoginEmail.value);
      setFieldState(inputLoginEmail, err);
    }
  });

  inputRegisterEmail?.addEventListener('input', () => {
    if (inputRegisterEmail.value.trim().length > 0) {
      const err = validateEmail(inputRegisterEmail.value);
      if (!err) {
        setFieldState(inputRegisterEmail, null);
      }
    } else {
      clearFieldState(inputRegisterEmail);
    }
  });

  inputRegisterEmail?.addEventListener('blur', () => {
    if (inputRegisterEmail.value.trim().length > 0) {
      const err = validateEmail(inputRegisterEmail.value);
      setFieldState(inputRegisterEmail, err);
    }
  });

  inputForgotEmail?.addEventListener('input', () => {
    if (inputForgotEmail.value.trim().length > 0) {
      const err = validateEmail(inputForgotEmail.value);
      if (!err) {
        setFieldState(inputForgotEmail, null);
      }
    } else {
      clearFieldState(inputForgotEmail);
    }
  });

  // --------------------------------------------------------------------------
  // 7. CARGA Y PERSISTENCIA DE "RECORDAR CORREO"
  // --------------------------------------------------------------------------
  const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
  if (savedEmail && inputLoginEmail && checkRememberEmail) {
    inputLoginEmail.value = savedEmail;
    checkRememberEmail.checked = true;
    setFieldState(inputLoginEmail, null);
  }

  // --------------------------------------------------------------------------
  // 8. ENVÍO DEL FORMULARIO DE INICIO DE SESIÓN
  // --------------------------------------------------------------------------
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputLoginEmail.value;
    const password = inputLoginPassword.value;

    let hasErrors = false;

    // Validar correo
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldState(inputLoginEmail, emailError);
      hasErrors = true;
    } else {
      setFieldState(inputLoginEmail, null);
    }

    // Validar contraseña
    if (!password) {
      setFieldState(inputLoginPassword, 'Por favor ingresa tu contraseña institucional.');
      hasErrors = true;
    } else if (password.length < 6) {
      setFieldState(inputLoginPassword, 'La contraseña debe contener al menos 6 caracteres.');
      hasErrors = true;
    } else {
      setFieldState(inputLoginPassword, null);
    }

    if (hasErrors) {
      // Poner foco en el primer campo inválido
      const firstInvalid = formLogin.querySelector('.has-error input');
      firstInvalid?.focus();
      return;
    }

    // Manejar persistencia de correo
    if (checkRememberEmail?.checked) {
      localStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_EMAIL);
    }

    // Iniciar estado de carga
    btnSubmitLogin.classList.add('is-loading');

    try {
      // Simular latencia de autenticación segura
      await new Promise(resolve => setTimeout(resolve, 1400));

      btnSubmitLogin.classList.remove('is-loading');
      showToast('Acceso Concedido', 'Iniciando sesión en tu Campus Virtual...', 'success');

      // Limpiar contraseña tras inicio exitoso y redirigir al dashboard
      inputLoginPassword.value = '';
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (err) {
      btnSubmitLogin.classList.remove('is-loading');
      showToast('Error de Conexión', 'No pudimos verificar tus credenciales. Intenta de nuevo.', 'error');
    }
  });

  // --------------------------------------------------------------------------
  // 9. ENVÍO DEL FORMULARIO DE REGISTRO
  // --------------------------------------------------------------------------
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = inputRegisterName.value.trim();
    const email = inputRegisterEmail.value.trim();
    const password = inputRegisterPassword.value;
    const termsChecked = checkRegisterTerms.checked;

    let hasErrors = false;

    // Validar Nombre
    if (!name) {
      setFieldState(inputRegisterName, 'Ingresa tu nombre y apellidos completos.');
      hasErrors = true;
    } else if (name.length < 3) {
      setFieldState(inputRegisterName, 'El nombre debe tener al menos 3 caracteres.');
      hasErrors = true;
    } else {
      setFieldState(inputRegisterName, null);
    }

    // Validar Correo
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldState(inputRegisterEmail, emailError);
      hasErrors = true;
    } else {
      setFieldState(inputRegisterEmail, null);
    }

    // Validar Contraseña
    const strength = evaluatePasswordStrength(password);
    if (!password) {
      setFieldState(inputRegisterPassword, 'Por favor crea una contraseña segura.');
      hasErrors = true;
    } else if (password.length < 8) {
      setFieldState(inputRegisterPassword, 'La contraseña debe tener mínimo 8 caracteres.');
      hasErrors = true;
    } else if (strength.score < 2) {
      setFieldState(inputRegisterPassword, 'La contraseña es muy sencilla. Incluye mayúsculas y números.');
      hasErrors = true;
    } else {
      setFieldState(inputRegisterPassword, null);
    }

    // Validar Términos
    const termsErrorEl = document.getElementById('register-terms-error');
    if (!termsChecked) {
      if (termsErrorEl) termsErrorEl.textContent = 'Debes aceptar el Código de Integridad Académica.';
      termsErrorEl?.classList.add('visible');
      hasErrors = true;
    } else {
      if (termsErrorEl) termsErrorEl.textContent = '';
      termsErrorEl?.classList.remove('visible');
    }

    if (hasErrors) {
      const firstInvalid = formRegister.querySelector('.has-error input') || (!termsChecked ? checkRegisterTerms : null);
      firstInvalid?.focus();
      return;
    }

    // Iniciar carga
    btnSubmitRegister.classList.add('is-loading');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      btnSubmitRegister.classList.remove('is-loading');
      showToast('Registro Completado', `Bienvenido(a), ${name}. Ya puedes iniciar sesión con tu cuenta.`, 'success');

      // Limpiar formulario y cambiar a vista de login pre-rellenando el correo
      formRegister.reset();
      passwordStrengthContainer.className = 'password-strength-container';
      if (strengthText) strengthText.textContent = 'Seguridad: Ingresa una contraseña';

      switchTab('login');
      if (inputLoginEmail) {
        inputLoginEmail.value = email;
        setFieldState(inputLoginEmail, null);
      }
      inputLoginPassword?.focus();
    } catch (err) {
      btnSubmitRegister.classList.remove('is-loading');
      showToast('Error en el Registro', 'Ocurrió un inconveniente al procesar la solicitud.', 'error');
    }
  });

  // --------------------------------------------------------------------------
  // 10. MODAL ACCESIBLE DE RECUPERACIÓN DE CONTRASEÑA
  // --------------------------------------------------------------------------
  function openForgotPasswordModal() {
    lastFocusedElementBeforeModal = document.activeElement;
    modalForgotPassword?.classList.remove('hidden');
    modalForgotViewForm?.classList.remove('hidden');
    modalForgotViewSuccess?.classList.add('hidden');

    // Si ya había un correo en el login, colocarlo como sugerencia
    if (inputLoginEmail && inputLoginEmail.value && inputForgotEmail) {
      inputForgotEmail.value = inputLoginEmail.value.trim();
    }

    clearFieldState(inputForgotEmail);
    setTimeout(() => inputForgotEmail?.focus(), 50);
    document.addEventListener('keydown', handleModalKeydown);
  }

  function closeForgotPasswordModal() {
    modalForgotPassword?.classList.add('hidden');
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    document.removeEventListener('keydown', handleModalKeydown);
    if (lastFocusedElementBeforeModal) {
      lastFocusedElementBeforeModal.focus();
    }
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      closeForgotPasswordModal();
    }
  }

  btnTriggerForgotPassword?.addEventListener('click', openForgotPasswordModal);
  btnCloseModalForgot?.addEventListener('click', closeForgotPasswordModal);
  btnCancelModalForgot?.addEventListener('click', closeForgotPasswordModal);
  modalForgotDoneBtn?.addEventListener('click', closeForgotPasswordModal);

  // Cerrar al hacer clic en el backdrop fuera de la tarjeta
  modalForgotPassword?.addEventListener('click', (e) => {
    if (e.target === modalForgotPassword) {
      closeForgotPasswordModal();
    }
  });

  // Envío del formulario de recuperación
  formForgotPassword?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputForgotEmail.value.trim();
    const emailError = validateEmail(email);

    if (emailError) {
      setFieldState(inputForgotEmail, emailError);
      inputForgotEmail.focus();
      return;
    }

    setFieldState(inputForgotEmail, null);
    btnSubmitForgot.classList.add('is-loading');

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      btnSubmitForgot.classList.remove('is-loading');

      // Mostrar vista de confirmación
      modalForgotViewForm?.classList.add('hidden');
      modalForgotViewSuccess?.classList.remove('hidden');
      if (forgotConfirmedEmail) {
        forgotConfirmedEmail.textContent = email;
      }

      // Iniciar cuenta regresiva de 60 segundos
      let remainingSeconds = 60;
      if (forgotCountdownTimer) forgotCountdownTimer.textContent = `${remainingSeconds}s`;

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        remainingSeconds -= 1;
        if (forgotCountdownTimer) {
          forgotCountdownTimer.textContent = `${remainingSeconds}s`;
        }
        if (remainingSeconds <= 0) {
          clearInterval(countdownInterval);
          if (forgotCountdownTimer) {
            forgotCountdownTimer.textContent = 'Disponible ahora';
          }
        }
      }, 1000);

      showToast('Enlace Enviado', `Se envió la confirmación a ${email}`, 'success');
    } catch (err) {
      btnSubmitForgot.classList.remove('is-loading');
      showToast('Error', 'No se pudo enviar el correo de recuperación.', 'error');
    }
  });

  // --------------------------------------------------------------------------
  // 11. ACCIONES SSO (GOOGLE / MICROSOFT) SIMULADAS
  // --------------------------------------------------------------------------
  btnSsoGoogle?.addEventListener('click', () => {
    showToast('Autenticación Institucional', 'Conectando con Google Workspace for Education...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 900);
  });

  btnSsoMicrosoft?.addEventListener('click', () => {
    showToast('Autenticación Institucional', 'Conectando con Microsoft 365 Educación...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 900);
  });

  // --------------------------------------------------------------------------
  // 12. SISTEMA DE NOTIFICACIONES TOAST ACCESIBLE
  // --------------------------------------------------------------------------
  /**
   * Muestra un toast no invasivo en la interfaz
   * @param {string} title 
   * @param {string} message 
   * @param {'success'|'error'} type 
   */
  function showToast(title, message, type = 'success') {
    if (!toastRegion) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'status');

    const iconSvg = type === 'success'
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `
      <div class="toast-icon-box" aria-hidden="true">${iconSvg}</div>
      <div class="toast-body">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-message">${message}</p>
      </div>
      <button type="button" class="toast-close" aria-label="Cerrar notificación">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn?.addEventListener('click', dismiss);

    toastRegion.appendChild(toast);

    // Auto-descarte después de 4.5 segundos
    setTimeout(() => {
      if (document.body.contains(toast)) {
        dismiss();
      }
    }, 4500);
  }
});
