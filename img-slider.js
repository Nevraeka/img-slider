(function (document, window) {
  if(!window || !document) { return; }
  if(!window.customElements || !HTMLElement.prototype.attachShadow) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-sd-ce.js', loadImgIcon)
  } else {
    loadImgIcon(); }

    (function () {
      if ( typeof window.CustomEvent === "function" ) { return false; }
      function CustomEvent ( event, params ) {
        params = params || { bubbles: true, cancelable: false, composed: true, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail, params.composed );
        return evt;
       }
      CustomEvent.prototype = window.Event.prototype;
      window.CustomEvent = CustomEvent;
    })();

  function loadScript(url, callback){
    const script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState){
      script.onreadystatechange = function(){
        if (script.readyState === "loaded" || script.readyState === "complete"){
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      script.onload = function (){ callback() };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  function loadImgIcon(){
    loadScript('https://cdn.rawgit.com/Nevraeka/img-icon/master/img-icon.js', loadComponent);
  }

  function loadComponent() {
    if (!window.customElements.get('img-slider')) {
  
      class ImgSlider extends HTMLElement {

        static get observedAttributes() { return ['show-counter']; }
        
        static get dependencies(){
          return [
            {
              name: 'img-icon',
              source: {
                beta: 'https://rawgit.com/Nevraeka/img-icon/master/img-icon.js',
                prod: 'https://cdn.rawgit.com/Nevraeka/img-icon/master/img-icon.js'
              }
            }
          ]; 
        }

        constructor() {
          super();
          this._root = null;

          this.state = {
            count: 0,
            isLocked: false,
            selectedIndex: 0,
            _frameCount: 30,
            _position: null,
            _width: null
          };
        }

        get isLocked() { return this.state.isLocked; }

        get selectedIndex() { return this.state.selectedIndex; }
        
        get count() { return this.state.count; }

        connectedCallback(){
          if (this._root === null) {
            this._root = this.attachShadow({ mode: "open" });
          } else { 
            this._root = this;
          }
          this.state._width = this.getBoundingClientRect().width;
          this.state.count = findTotalCount(this);
          render(this);
          this._root.querySelector('#main').addEventListener('slotchange', slotChangedHandler.bind(this));
        }
        
        attributeChangedCallback(name, oldVal, newVal){
          if(oldVal === newVal) { return; }
          if(name === 'show-counter') {  displayCounter(this, newVal); }
        }
        
        next(){
          if (this.selectedIndex < this.count - 1) {
            this.state.selectedIndex = this.state.selectedIndex + 1;
            this.$slide.style.setProperty('--img-slider--index', this.state.selectedIndex);
            this.$counter.setAttribute('data-index', `${this.state.selectedIndex + 1}`);
            this.dispatchEvent(new CustomEvent('slide-changed', { detail: { selectedIndex: this.selectedIndex }, composed: true, bubbles: true }));
          }
        }
        
        prev(){
          if (this.selectedIndex !== 0) {
            this.state.selectedIndex = this.state.selectedIndex - 1;
            this.$slide.style.setProperty('--img-slider--index', this.state.selectedIndex);
            this.$counter.setAttribute('data-index', `${this.state.selectedIndex + 1}`);
            this.dispatchEvent(new CustomEvent('slide-changed', { detail: { selectedIndex: this.selectedIndex }, composed: true, bubbles: true }));
          } 
        }
        
        slideTo(index) {
          if(!index || typeof index !== 'number') { return; }
          const idx = Math.round(index);
          if(idx > 0 && idx < this.count - 1) {
            this.state.selectedIndex = idx - 1;
            this.$slide.style.setProperty('--img-slider--index', this.state.selectedIndex);
            this.$counter.setAttribute('data-index', `${idx}`);
            this.dispatchEvent(new CustomEvent('slide-changed', { detail: { selectedIndex: idx }, composed: true, bubbles: true }));
          }
        }

        disconnectedCallback(){
          this._root.querySelector('#main').removeEventListener('slotchange', slotChangedHandler.bind(this));
          this._root.innerHTML = '';
        }
        
      }
      window.customElements.define('img-slider', ImgSlider );
    }
  }

  function slotChangedHandler(e) {
    this.state._width = this.getBoundingClientRect().width;
    this.state.count = findTotalCount(this);
    render(this);
    this.$slide = this._root.querySelector('.img_slider__container');
    this.$counter = this._root.querySelector('.img_slider__counter span');
    this.removeEventListener('mousedown', lockImg, false);
    this.addEventListener('mousedown', lockImg, false);
    this.removeEventListener('touchstart', lockImg, false);
    this.addEventListener('touchstart', lockImg, false);
    this.removeEventListener('mouseup', moveImg, false);
    this.addEventListener('mouseup', moveImg, false);
    this.removeEventListener('touchend', moveImg, false);
    this.addEventListener('touchend', moveImg, false);
    this.removeEventListener('touchmove', dragImg, false);
    this.addEventListener('touchmove', dragImg, false);
    this.removeEventListener('mousemove', dragImg, false);
    this.addEventListener('mousemove', dragImg, false);
    this.removeEventListener('resize', sizeImg.bind(this), false);
    this.addEventListener('resize', sizeImg.bind(this), false);
    displayCounter(this, this.getAttribute('show-counter'));
  }

  function displayCounter(component, newVal){
    if (component._root) {
      if(newVal === 'true') { component.$counter.style.display = 'flex'; }
      else { component.$counter.style.display = 'none'; }
    }
  }
  
  function findTotalCount(component) {
    return component.querySelectorAll('picture, img').length - component.querySelectorAll('picture > img').length || 0;
  }

  function sizeImg() { this.state._width = this.getBoundingClientRect().width; }

  function dragImg(evt) {
    evt.preventDefault();
    const container = evt.target;
    if(container.isLocked) {
      container.$slide.style.setProperty('--img-slider--tx', `${Math.round(unify(evt).clientX - container.state._position)}px`);
    }
  }

  function unify(evt) { return evt.changedTouches ? evt.changedTouches[0] : evt; }

  function lockImg(evt) {
    const container = evt.target;
    if(container && container.state && container.$slide) {
      container.state._position = unify(evt).clientX;
      container.$slide.classList.toggle('smooth', !(container.state.isLocked = true));
    }
  }

  function moveImg(evt) {
    const container = evt.target;
    if(container.isLocked){
      let distance = unify(evt).clientX - container.state._position;
      let direction = Math.sign(distance);
      let factor = +(direction * distance / container.state._width).toFixed(2);
      if((container.selectedIndex > 0 || direction < 0) &&
        (container.selectedIndex < container.count - 1 || direction > 0) && factor > .2) {
        container.$slide.style.setProperty('--img-slider--index', container.state.selectedIndex -= direction);
        container._root.querySelector('.img_slider__counter span').setAttribute('data-index', `${container.state.selectedIndex + 1}`);
        factor = 1 - factor;
      }
      container.$slide.style.setProperty('--img-slider--tx', '0px');
      container.$slide.classList.toggle('smooth', !(container.state.isLocked = false));
      container.$slide.style.setProperty('--img-slider--factor', factor);
      container.state._position = null;
    }
    container.dispatchEvent(new CustomEvent('slide-changed', { detail: { selectedIndex: container.selectedIndex }, composed: true, bubbles: true }));
  }

  function render(component) {
    if(!component._root) { return; }
    if (window.ShadyCSS) { ShadyCSS.styleElement(component); }
    if(component._root.children.length > 0) { component._root.innerHTML = '' };
    let $template = document.createElement('template');
    $template.innerHTML = `
      <style>
        :host {
          position: relative;
          display: block;
          overflow-x: hidden;
          max-height: 100%;
        }

        .img_slider__container,
        ::slotted(img),
        ::slotted(picture) {
          display: block;
          padding: 0;
          margin: 0;
        }

        .smooth { transition: transform calc(var(--img-slider--factor, 1) * .5s) ease-out;  }

        .img_slider__container,
        .img_slider__counter {
          display: flex;
          align-items: center;
        }
        .img_slider__container {
          --img-slider--count: ${component.count};
          min-width: 100%;
          min-height: 50%;
          max-height: 100%;
          background: #333;
          background: var(--img-slider--bkg-color, #333);
          width: 100%;
          width: calc(var(--img-slider--count) * 100%);
          overflow-y: hidden;
          transform: translate(calc(var(--img-slider--index, 0) / var(--img-slider--count) * -100% + var(--img-slider--tx, 0px)));
          transition: transform .5s ease-out;
        }

        ::slotted([slot=prev-action]),
        ::slotted([slot=next-action]),
        ::slotted([slot=custom-action]),
        .img_slider__counter {
          position: absolute;
          z-index: 10;
        }

        .img_slider__counter {
          bottom: 10px;
          left: 10px;
          padding: 8px 16px;
          background-color: rgba(0,0,0, .7);
          color: #fff;
          border-radius: 4px;
        }

        .img_slider__counter span:before {
          padding: 0 5px 0 0;
          content: attr(data-index);
        }

        .img_slider__counter span:after {
          padding: 0 5px;
          content: '${component.count}';
        }

        ::slotted([slot=prev-action]),
        ::slotted([slot=next-action]),
        ::slotted([slot=custom-action]) {
          cursor: pointer;
        }

        ::slotted(img),
        ::slotted(picture) {
          user-select: none;
          width: 100%;
          width: calc(100% / var(--img-slider--count));
          pointer-events: none;
        }
        ::slotted([fallback]) {
          display: none;
        }
      </style>
      <slot name="prev-action"></slot>
      <div class="img_slider__counter"><span data-index="${component.selectedIndex + 1}">of</span><img-icon shape="photoCollection" fill=100"></img-icon></div>
      <div class="img_slider__container" style="--img-slider--index: ${component.selectedIndex}">
        <slot id="main"></slot>  
      </div>
      <slot name="next-action"></slot>
      <slot name="custom-action"></slot>
    `;

    if (window.ShadyCSS) { ShadyCSS.prepareTemplate($template, 'img-slider'); }
    component._root.appendChild(document.importNode($template.content, true));
  }

})(document, window);