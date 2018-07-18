const allowedKeyCodes = [ 13, 27, 32, 35, 36, 37, 38, 39, 40 ];

class Select{
  constructor( el, options ){
    this._options = Object.assign({
      activeClass: 'active',
      template: this._template,
      useSelect: false
    }, options );

    this._handleChange = this._handleChange.bind( this );
    this._handleClick = this._handleClick.bind( this );
    this._handleClose = this._handleClose.bind( this );
    this._handleKey = this._handleKey.bind( this );
    this._moveFocus = this._moveFocus.bind( this );

    this._select = el;

    this._root = this._select.parentElement;

    this._parse();

    if( this._options.useSelect ){
      this._createLight();
    }
    else {
      this._create();
    }

    this._append();

    this._getMaxWidth();

    // update the labels when the true select changes
    this._select.addEventListener( 'change', this._handleChange );

    if( this._options.useSelect ){
      return;
    }

    // close the list if the user is leaving the select
    document.body.addEventListener( 'click', this._handleClose );
    document.body.addEventListener( 'focus', this._handleClose, true );

    // manage clicks inside the select
    this._button.addEventListener( 'click', this._handleClick );
    this._listbox.addEventListener( 'click', this._handleClick );

    // manage keyboard inputs inside the select
    this._button.addEventListener( 'keydown', this._handleKey );
    this._listbox.addEventListener( 'keydown', this._handleKey );

    // ensure the focus is on the button instead of the select
    this._select.addEventListener( 'focus', this._moveFocus, true );
  }

  get options(){
    return this._selectOptions;
  }

  get selectedIndex(){
    return this._selectedIndex;
  }

  set selectedIndex( index ){
    if( !this._options.useSelect && !this.listOptions ){
      return;
    }

    if( !this.multiple && this.listOptions ){
      this.listOptions[ this._selectedIndex ].removeAttribute( 'aria-selected' );
    }

    this._select.selectedIndex = index;
    this._selectedIndex = index;

    if( this.listOptions ){
      this.listOptions[ this._select.selectedIndex ].setAttribute( 'aria-selected', 'true' );
    }

    this._setButtonLabel();
  }

  _append(){
    const parent = this._select.parentElement;
    const elements = Array.from( this._dom.children );

    elements.forEach( el => {
      parent.appendChild( el );
    });
  }

  _create(){
    const optionsLength = this._selectOptions.length;

    this._dom = document.createDocumentFragment();
    this._button = document.createElement( 'button' );

    this._button.setAttribute( 'aria-haspopup', 'listbox' );
    this._button.setAttribute( 'aria-expanded', 'false' );
    this._button.setAttribute( 'type', 'button' );

    if( this.label ){
      this._button.setAttribute( 'aria-labelledby', this.label.id );
    }

    this._button.innerHTML = '<span></span>';

    this._setButtonLabel();

    this._dom.appendChild( this._button );

    this._listbox = document.createElement( 'ul' );
    this._listbox.setAttribute( 'role', 'listbox' );
    this._listbox.setAttribute( 'aria-hidden', 'true' );
    this._listbox.setAttribute( 'tabindex', '-1' );

    if( this.label ){
      this._listbox.setAttribute( 'aria-labelledby', this.label.id );
    }

    if( this.multiple ){
      this._listbox.setAttribute( 'aria-multiselectable', 'true' );
    }

    this._dom.appendChild( this._listbox );

    const groups = this._selectGroups.map(( group, index ) => {
      const groupItem = document.createElement( 'li' );
      const groupList = document.createElement( 'ul' );
      const groupLabel = document.createElement( 'p' );
      const groupId = `${this._select.name || this._options.name}-group-${index}`;

      groupItem.appendChild( groupLabel );
      groupItem.appendChild( groupList );

      groupItem.setAttribute( 'role', 'group' );
      groupItem.setAttribute( 'aria-labelledby', groupId );

      groupList.setAttribute( 'role', 'presentation' );

      groupLabel.setAttribute( 'id', groupId );
      groupLabel.setAttribute( 'role', 'presentation' );
      groupLabel.classList.add( 'optgroup' );
      groupLabel.innerHTML = this._options.template( group.label, group.nodeName.toLowerCase());

      return groupItem;
    });

    const groupsLenth = groups.length;

    this.listOptions = this._selectOptions.map(( option, index ) => {
      const item = document.createElement( 'li' );

      item.setAttribute( 'role', 'option' );
      item.setAttribute( 'id', `${this._select.name || this._options.name}-${index}` );

      if( groupsLenth ){
        item.setAttribute( 'aria-setsize', optionsLength );
        item.setAttribute( 'aria-posinset', index + 1 );
      }

      if( index === this.selectedIndex ){
        item.setAttribute( 'aria-selected', 'true' );
      }

      item.innerHTML = this._options.template( option.label, option.nodeName.toLowerCase());

      if( option.parentElement.nodeName === 'OPTGROUP' ){
        const group = groups[ this._selectGroups.indexOf( option.parentElement ) ];

        group.children[ 1 ].appendChild( item );

        if( !this._listbox.contains( group )){
          this._listbox.appendChild( group );
        }
      }
      else{
        this._listbox.appendChild( item );
      }

      return item;

    });
  }

  _createLight(){
    this._dom = document.createDocumentFragment();
    this._button = document.createElement( 'span' );
    this._button.innerHTML = '<span></span>';

    this._setButtonLabel();

    this._dom.appendChild( this._button );
  }

  _focus( dir ){
    let nextSelectedIndex = this._activeIndex + dir;
    const maxIndex = this.listOptions.length - 1;

    if( nextSelectedIndex < 0 ){
      nextSelectedIndex = maxIndex;
    }
    else if( nextSelectedIndex > maxIndex ){
      nextSelectedIndex = 0;
    }

    const nextOption = this.listOptions[ nextSelectedIndex ];
    const lastOption = this.listOptions[ this._activeIndex ];

    lastOption.classList.remove( this._options.activeClass );
    lastOption.removeAttribute( 'tabindex' );

    nextOption.classList.add( this._options.activeClass );

    nextOption.setAttribute( 'tabindex', -1 );

    nextOption.focus();

    this._listbox.setAttribute( 'aria-activedescendant', nextOption.id );

    this._activeIndex = nextSelectedIndex;
  }

  _getMaxWidth(){
    this._button.firstElementChild.style.display = 'display: inline-block';

    const widths = this._selectOptions.map( option => {
      const label = this._options.template( option.label, 'button' );

      this._button.firstElementChild.innerHTML = label;

      return this._button.firstElementChild.clientWidth;
    });

    this._button.firstElementChild.removeAttribute( 'style' );

    this._setButtonLabel();

    this.width = Math.max.apply( null, widths );

    this._button.firstElementChild.style.minWidth = `${this.width}px`;
  }

  _handleChange(){
    this.selectedIndex = this._select.selectedIndex;
  }

  _handleClick( event ){
    if( event.detail !== 1 ){
      return;
    }

    if( this._button.contains( event.target )){
      this._handleExpand();

      return;
    }

    if( this._listbox.contains( event.target )){
      this._handleSelection( event );

      return;
    }
  }

  _handleClose( event ){
    if( this._root.contains( event.target )){
      return;
    }

    this._handleExpand( false );
  }

  _handleExpand( expandedState ){
    const expanded = expandedState !== undefined ? !expandedState : this._button.getAttribute( 'aria-expanded' ) === 'true';

    this._button.setAttribute( 'aria-expanded', !expanded );
    this._listbox.setAttribute( 'aria-hidden', expanded );

    const activeOption = this.listOptions[ this._activeIndex ];

    activeOption.classList.toggle( this._options.activeClass, !expanded );

    if( !expanded ){
      activeOption.removeAttribute( 'tabindex' );
    }
  }

  _handleKey( event ){
    if( allowedKeyCodes.indexOf( event.keyCode ) === -1 ){
      return;
    }

    event.preventDefault();

    // close the listbox
    if( event.keyCode === 27 ){
      this._handleExpand( false );
      this._button.focus();

      return;
    }

    // enter
    if( event.keyCode === 13 ){
      if( this._button.contains( event.target )){
        this._handleExpand();
        this._listbox.focus();

        return;
      }

      this._selectIndex( this._activeIndex );

      return;
    }

    // spacebar
    if( event.keyCode === 32 && !this._button.contains( event.target )){
      if( this.multiple ){
        this._toggleOption( this.listOptions[ this._activeIndex ], this._activeIndex );
      }
      else {
        this.selectedIndex = this._activeIndex;
      }

      return;
    }


    // arrows
    if( event.keyCode >= 37 && event.keyCode <= 40 ){
      if( this._button.contains( event.target )){
        this._handleExpand();
        this._listbox.focus();

        return;
      }

      // move the focus
      this._focus( event.keyCode < 39 ? -1 : 1 );

      return;
    }

  }

  _handleSelection( event ){
    const selectedIndex = this.listOptions.findIndex( el => {
      return el.contains( event.target );
    });

    if( selectedIndex < 0 ){
      return;
    }

    this._selectIndex( selectedIndex );
  }

  _moveFocus(){
    this._button.focus();
  }

  _parse(){
    this._selectOptions = Array.prototype.slice.call( this._select.options );

    this.size = this._select.size;
    this.multiple = this._select.multiple;
    this._selectedIndex = this._select.selectedIndex;
    this._activeIndex = this._selectedIndex < 0 ? 0 : this._selectedIndex;
    this.label = document.querySelector( `[for=${this._select.id}]` );

    if( this.label && !this.label.id ){
      this.label.setAttribute( 'id', `${this._select.name}-label` );
    }

    this._selectGroups = Array.prototype.slice.call( this._select.querySelectorAll( 'optgroup' ));

    if( !this._options.useSelect ){
      this._select.setAttribute( 'tabindex', '-1' );
    }
  }

  _selectIndex( index ){
    if( this.multiple ){
      this._toggleOption( this.listOptions[ index ], index );

      return;
    }

    this.selectedIndex = index;
    this._handleExpand( false );
    this._button.focus();
  }

  _setButtonLabel(){
    const label = this._options.template( this.selectedIndex > -1 ? this._selectOptions[ this.selectedIndex ].label : '', 'button' );

    this._button.firstElementChild.innerHTML = label;
  }

  _template( label ){
    return label;
  }

  _toggleOption( option, index ){
    const selected = option.hasAttribute( 'aria-selected' );

    if( !selected ){
      this.selectedIndex = index;

      return;
    }

    option.removeAttribute( 'aria-selected' );
  }
}

export default Select;
