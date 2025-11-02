//defer loading because of fastboot and similar

export default class GenuineCaptcha extends HTMLElement {

  captchaSecret=null;
  timerId=null;
  name='';
  gcApiUrl =  `https://api.genuine-captcha.io`;
  handleVerify=(a,b,c)=>{};
  handleReset=(a)=>{};
  
  _handleVerify=async (solution, secret)=>{
    if(this.name!==''){
      this.handleVerify(this.name,solution, secret);
    }else{
      this.handleVerify(solution, secret);
    }
  }
  
  _handleReset=async ()=>{
    if(this.name!==''){
      this.handleReset(this.name);
    }else{
      this.handleReset();
    }
  }
  
  constructor() {
    super();
    this.abortController = new AbortController();
    this.texts = {};
    if(navigator.language.toLowerCase().indexOf('de')===0){
      this.texts = {
        puzzleTitle: 'Kleines Rätsel: Was ist die Lösung?',
        inputPlaceholder: 'Deine Antwort',
        verifyButton: 'Überprüfen',
        verifying:'Prüfend...',
        refreshButton: 'Neues CAPTCHA',
        loadingCaptcha: 'Lade CAPTCHA...',
        errorLoadingCaptcha: 'Fehler beim Laden des CAPTCHAs. Bitte versuche es erneut.',
        errorIncorrectSolution: 'Falsche Lösung. Bitte versuche es erneut.',
        errorFailedToVerify: 'Fehler bei der Überprüfung. Bitte versuche es erneut.',
        successMessage: 'Erfolg! CAPTCHA korrekt gelöst.',
        alertNoSolution: 'Bitte gib deine Antwort zum CAPTCHA ein',
        responseOk: '<strong>Erfolg!</strong> CAPTCHA korrekt gelöst.',
        responseNotOk: '<strong>Fehler:</strong> Falsche Lösung. Bitte versuche es erneut.',
        responseFailedToVerify: '<strong>Fehler:</strong> Fehler bei der Überprüfung. Bitte versuche es erneut.'
      };
    }
    if(navigator.language.toLowerCase().indexOf('en')===0 || this.texts.puzzleTitle===undefined){
      this.texts = {
        puzzleTitle: 'Tiny puzzle time: what is the solution?',
        inputPlaceholder: 'Your answer',
        verifyButton: 'Verify',
        verifying:'Verifying...',
        refreshButton: 'Try Another CAPTCHA',
        loadingCaptcha: 'Loading CAPTCHA...',
        errorLoadingCaptcha: 'Error loading CAPTCHA. Please try again.',
        errorIncorrectSolution: 'Incorrect solution. Please try again.',
        errorFailedToVerify: 'Failed to verify. Please try again.',
        successMessage: 'Success! CAPTCHA verified correctly.',
        alertNoSolution: 'Please enter your answer to the CAPTCHA',
        responseOk: '<strong>Success!</strong> CAPTCHA verified correctly.',
        responseNotOk: '<strong>Error:</strong> Incorrect solution. Please try again.',
        responseFailedToVerify: '<strong>Error:</strong> Failed to verify. Please try again.'
      };
    }
    
    this.captchaSecret = '';
    const template = document.getElementById('genuine-captcha');
    const templateContent = template.content;

    this.attachShadow({ mode: 'open' });

    const shadowRoot = this.shadowRoot;

    const style = document.createElement('style');
    style.textContent = `
          :host{
            --verify-button-background-color:#6366f1;
            --verify-button-background-color-hover:#4346d4;
          }

          .captcha-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            width:100%;
            position:relative;
        }
          #captcha-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            position: relative;
            opacity:0;
            transition:all 0.2s ease-in-out;
        }

        #captcha-display.show{
          opacity:1;
        }
        
        #captcha-image-container {
            position: relative;
            
            overflow: hidden;
            width: 200px;
            height: calc(150px + 2rem);
            display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
        }
        
        #captcha-image {
            max-width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
        }
        
        #captcha-loading {

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            position: absolute;
            background: white;
            width: 100%;
            border-radius: 0.5rem;
            opacity: 0;
            
            transition:all 0.2s ease-in-out;
        }
        #captcha-loading.show{
          opacity:0.9;
          top:0;
        }

        #captcha-loading:not(.show){
          animation:moveOut 0.3s linear forwards;
        }
        
        @keyframes moveOut {
          0% { top:0; }
          99% { top:0; }
          100% { top:-100%; }
        }
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #6366f1;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        input {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }

        #allowed-action{
          display: flex;
          flex-direction: column;
          align-items: center;
          position:absolute;
          opacity:0;
          transition:all 0.2s ease-in-out;
          height:100%;
          justify-content: center;
        }

        #allowed-action.show{
          opacity:1;
        }

        #allowed-action:not(.show){
          animation:moveOut 0.3s linear forwards;
        }

        #refresh-captcha{
          background-color: transparent;
          border: none;
          text-decoration: underline;
          font-size: small;
          color: var(--form-primary);
          cursor:pointer;

        }
        
        #verify-captcha {
            padding: 8px 16px;
            border-radius: 6px;
        }

        #verify-captcha:not(:disabled) {
            background-color: var(--verify-button-background-color);
            color: white;
            border: 2px solid var(--verify-button-background-color);
            cursor: pointer;
            transition: background-color 0.3s;
        }

        #verify-captcha:disabled,#verify-captcha.disabled {
          cursor:not-allowed;
        }
        
        #verify-captcha:not(:disabled):hover {
            background-color: var(--verify-button-background-color-hover);
        }
        
        #captcha-error {
            padding: 15px;
            border-radius: 6px;
            display: none;
            margin-top: 15px;
       
        }

        #captcha-error.error {
           display: block;
        }

        .captcha-result {
            padding: 15px;
            border-radius: 6px;
            display: none;
            margin-bottom: 15px;
         
        }
        
        .success {
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 15px;
            border-radius: 6px;
            display: block;
            margin-bottom: 15px;
           
        }
        
        .error {
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
      `;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(templateContent.cloneNode(true));

    shadowRoot.querySelector('#captcha-solution').setAttribute('aria-label', this.texts.inputPlaceholder);
    shadowRoot.querySelector('#verify-captcha').setAttribute('aria-label', this.texts.verifyButton);

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.id = 'sr-announcements';
    shadowRoot.appendChild(liveRegion);


    shadowRoot.querySelector('.captcha-container #puzzle-title').innerText = this.texts.puzzleTitle;
    shadowRoot.querySelector('.captcha-container #captcha-solution').placeholder = this.texts.inputPlaceholder;
    shadowRoot.querySelector('.captcha-container #verify-captcha').innerText = this.texts.verifyButton;
    shadowRoot.querySelector('.captcha-container #refresh-captcha .refresh-captcha-text').innerText = this.texts.refreshButton;
    shadowRoot.querySelector('.captcha-container #loading-catcha').innerText = this.texts.loadingCaptcha;

    shadowRoot.querySelector('.captcha-container #captcha-solution').addEventListener('keyup',(event)=>{
      const input = event.target;
      if(input.checkValidity()){
        shadowRoot.querySelector('.captcha-container #verify-captcha').disabled=false;
      }else{
        shadowRoot.querySelector('.captcha-container #verify-captcha').disabled=true;
      }

    })

    this.registerHandleVerify();
    this.registerHandleReset();

    this.refreshHandler = (event) => {
        event.stopPropagation();
        this._handleReset();
        this.loadCaptcha();
    };
    
    this.verifyHandler = (event) => {
        event.stopPropagation();
        this.verifyCaptcha();
    };
    
    this.shadowRoot.querySelector('#refresh-captcha').addEventListener('click', this.refreshHandler);
    this.shadowRoot.querySelector('#verify-captcha').addEventListener('click', this.verifyHandler);

    (async () => {
      await Sleep(100);
      this.loadCaptcha();
    })();
  }

  registerHandleVerify = async () => {
   let attempts = 0;
    const maxAttempts = 150; // 15 seconds
    
    while (window.genuineCaptchaHandleVerify === undefined && attempts < maxAttempts) {
        attempts++;
        await Sleep(100);
    }
    
    if (window.genuineCaptchaHandleVerify) {
        this.handleVerify = window.genuineCaptchaHandleVerify;
    } else {
        console.warn('genuineCaptchaHandleVerify hook not found, using default');
    }
  };

  registerHandleReset = async () => {
    while (window.genuineCaptchaReset === undefined) {
      await Sleep(100);
    }
    this.handleReset = window.genuineCaptchaReset;
  };

  static get observedAttributes() {
    return ['api-url', 'api-key','name'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'api-url') this.gcApiUrl = newValue;
    if (name === 'name') this.name = newValue;
  }

  startTimer=(delay)=> {
    clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.loadCaptcha();
    }, delay); //reload every 5 minutes
  }

  disconnectedCallback() {
      // Clear timer
      if (this.timerId) {
          clearTimeout(this.timerId);
          this.timerId = null;
      }
      
      // Abort fetch if in progress
      if (this.abortController) {
          this.abortController.abort();
      }
      
      // Remove event listeners
      if (this.refreshHandler) {
          this.shadowRoot.querySelector('#refresh-captcha')
              ?.removeEventListener('click', this.refreshHandler);
      }
      if (this.verifyHandler) {
          this.shadowRoot.querySelector('#verify-captcha')
              ?.removeEventListener('click', this.verifyHandler);
      }
  }

  loadCaptcha () {
    if (this.abortController) {
        this.abortController.abort();
    }
    this.abortController = new AbortController();

    if (this.isLoading) {
        console.log('Captcha already loading');
        return;
    }
    this.isLoading = true;

    if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }
    try{
    this.shadowRoot.getElementById('captcha-display').classList.add('show');
    this.shadowRoot.getElementById('captcha-loading').classList.add('show');

    this.shadowRoot.getElementById('captcha-error').classList.remove( 'error');
    this.shadowRoot.getElementById('allowed-action').classList.remove('show');
    this.shadowRoot.querySelector('.captcha-result').classList.remove( 'success');
    this.shadowRoot.getElementById('captcha-solution').value = '';
    

    }catch(error){
      console.error(error);
      this.isLoading=false;
      return;
    }
    fetch(`${this.gcApiUrl}/api/captcha/create`,{
        mode: 'cors',
        signal: this.abortController.signal
    })
        .then(response => response.json())
        .then(data => {

          if (!data || !data.ImageAsBase64 || !data.SecretAsBase64) {

             console.error('Invalid captcha response format');
             return;
          }
            const imageType = 'image/png';
            const base64Image = `data:${imageType};base64,${data.ImageAsBase64}`;
            this.shadowRoot.getElementById('captcha-image').src = base64Image;
            
            // Store the secret for verification later
            this.captchaSecret = data.SecretAsBase64;

            const validTill= (data.validTill || Date.now() + (1000 * 60 * 5))-2000; //5 minutes from now
        
            this.startTimer(validTill - Date.now()); //reload 4 minutes before expiry
            
            // Show the captcha and input field
            this.shadowRoot.getElementById('captcha-loading').classList.remove('show');
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.log('Captcha load aborted');
                return;
            }
            console.error("Error loading captcha:", error);
            this.shadowRoot.getElementById('captcha-loading').innerHTML = 
                this.texts.errorLoadingCaptcha;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

    verifyCaptcha() {
        if (this.isVerifying) {
            return;
        }
        const solution = this.shadowRoot.getElementById('captcha-solution').value.trim();
        if (!solution) {
            const errorElement = this.shadowRoot.getElementById('captcha-error');
            errorElement.classList.add('error');
            errorElement.textContent = this.texts.alertNoSolution;
            
            // Announce to screen readers
            const liveRegion = this.shadowRoot.getElementById('sr-announcements');
            liveRegion.textContent = this.texts.alertNoSolution;
            
            // Focus the input
            this.shadowRoot.getElementById('captcha-solution').focus();
            return;
        }

        const sanitizedSolution = solution.replace(/[^\w\s-]/g, '');
    
        // Limit length
        if (sanitizedSolution.length > 3) {
            // Show error
            return;
        }
        this.isVerifying = true;
        const verifyBtn = this.shadowRoot.getElementById('verify-captcha');
        const originalText = verifyBtn.textContent;
        verifyBtn.disabled = true;
        verifyBtn.textContent = this.texts.verifying;
        fetch(`${this.gcApiUrl}/api/captcha/verify?captchaSolution=${sanitizedSolution}&captchaSecret=${encodeURIComponent(this.captchaSecret)}`, {
            mode: 'cors',
            signal: this.abortController.signal
        })
        .then(response => {
            if (response.ok) {
              this.shadowRoot.getElementById('captcha-display').classList.remove('show');
              this.shadowRoot.getElementById('allowed-action').classList.add('show');
                const resultElement = this.shadowRoot.querySelector('.captcha-result');
                resultElement.classList.add( 'success');
                resultElement.innerHTML = this.texts.responseOk;
                this.shadowRoot.getElementById('captcha-error').classList.remove('error')
                
                
                this._handleVerify(solution, this.captchaSecret);
            } else {
                const errorElement = this.shadowRoot.getElementById('captcha-error');
                errorElement.classList.add('error');
                errorElement.innerHTML = this.texts.responseNotOk;
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.log('Captcha load aborted');
                return;
            }
            console.error("Error verifying captcha:", error);
            const errorElement = this.shadowRoot.getElementById('captcha-error');
            errorElement.classList.add('error');
            errorElement.innerHTML = this.texts.responseFailedToVerify;
        })
        .finally(() => {
            this.isVerifying = false;
            verifyBtn.disabled = false;
            verifyBtn.textContent = originalText;
        });
    }
}

async function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const _innerHTML = `<div class="captcha-container">
        <div id="captcha-display" class="show">
            <div id="captcha-image-container">
                <img id="captcha-image" alt="CAPTCHA Challenge" src="" loading="lazy"/>
                <button id="refresh-captcha">&#10227; <span class="refresh-captcha-text"/></button>     
            </div>
            
            <div id="captcha-input-container">
                <p id="puzzle-title">Tiny puzzle time: what is the solution?</p>
                <div class="input-group">
                    <input type="text" id="captcha-solution" placeholder="" pattern="[0-9]{1,2}" required>
                    <button id="verify-captcha" disabled></button>
                </div>
            </div>
            
            <div id="captcha-error"></div>
            
            <div id="captcha-loading">
                <div class="spinner"></div>
                <p id="loading-catcha"></p>
            </div>
        </div>
        <div id="allowed-action">
            <div class="captcha-result"></div>
            <slot></slot>
        </div>
        
    </div>`;

//defer loading because of fastboot and similar
if (typeof document !== 'undefined') {
    // Check if already defined
    if (customElements.get('genuine-captcha')) {
        console.warn('genuine-captcha already defined');
    } else {
        // Wait for DOM to be ready
        const initTemplate = () => {
            // Check if template already exists
            if (!document.getElementById('genuine-captcha')) {
                const tpl1 = document.createElement('template');
                tpl1.id = 'genuine-captcha';
                tpl1.innerHTML = _innerHTML;
                
                // Ensure body exists
                if (document.body) {
                    document.body.prepend(tpl1);
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        document.body.prepend(tpl1);
                    });
                }
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTemplate);
        } else {
            initTemplate();
        }
        
        customElements.define('genuine-captcha', GenuineCaptcha);
    }
}

export {GenuineCaptcha };