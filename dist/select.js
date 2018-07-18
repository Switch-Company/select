/**
 * @accede-web/select - 
 * @version v0.0.0
 * @link undefined
 * @license undefined
 **/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Select = factory());
}(this, (function () { 'use strict';

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var allowedKeyCodes = [13, 27, 32, 35, 36, 37, 38, 39, 40];

  var Select = function () {
    function Select(el, options) {
      classCallCheck(this, Select);

      this._options = Object.assign({
        activeClass: 'active',
        template: this._template
      }, options);

      this._handleChange = this._handleChange.bind(this);
      this._handleClick = this._handleClick.bind(this);
      this._handleClose = this._handleClose.bind(this);
      this._handleKey = this._handleKey.bind(this);

      this._select = el;

      this._root = this._select.parentElement;

      this._parse();

      this._create();

      this._append();

      this._getMaxWidth();

      document.body.addEventListener('click', this._handleClose);
      document.body.addEventListener('focus', this._handleClose, true);

      this._button.addEventListener('click', this._handleClick);
      this._listbox.addEventListener('click', this._handleClick);

      this._button.addEventListener('keydown', this._handleKey);
      this._listbox.addEventListener('keydown', this._handleKey);
    }

    createClass(Select, [{
      key: '_append',
      value: function _append() {
        var parent = this._select.parentElement;
        var elements = Array.from(this._dom.children);

        elements.forEach(function (el) {
          parent.appendChild(el);
        });
      }
    }, {
      key: '_create',
      value: function _create() {
        var _this = this;

        var optionsLength = this._selectOptions.length;

        this._dom = document.createDocumentFragment();
        this._button = document.createElement('button');

        this._button.setAttribute('aria-haspopup', 'listbox');
        this._button.setAttribute('aria-expanded', 'false');
        this._button.setAttribute('type', 'button');

        if (this.label) {
          this._button.setAttribute('aria-labelledby', this.label.id);
        }

        var label = this._options.template(this.selectedIndex > -1 ? this._selectOptions[this.selectedIndex].label : '', 'button');

        this._button.innerHTML = '<span>' + label + '</span>';

        this._dom.appendChild(this._button);

        this._listbox = document.createElement('ul');
        this._listbox.setAttribute('role', 'listbox');
        this._listbox.setAttribute('aria-hidden', 'true');
        this._listbox.setAttribute('tabindex', '-1');

        if (this.label) {
          this._listbox.setAttribute('aria-labelledby', this.label.id);
        }

        if (this.multiple) {
          this._listbox.setAttribute('aria-multiselectable', 'true');
        }

        this._dom.appendChild(this._listbox);

        var groups = this._selectGroups.map(function (group, index) {
          var groupItem = document.createElement('li');
          var groupList = document.createElement('ul');
          var groupLabel = document.createElement('p');
          var groupId = (_this._select.name || _this._options.name) + '-group-' + index;

          groupItem.appendChild(groupLabel);
          groupItem.appendChild(groupList);

          groupItem.setAttribute('role', 'group');
          groupItem.setAttribute('aria-labelledby', groupId);

          groupList.setAttribute('role', 'presentation');

          groupLabel.setAttribute('id', groupId);
          groupLabel.setAttribute('role', 'presentation');
          groupLabel.classList.add('optgroup');
          groupLabel.innerHTML = _this._options.template(group.label, group.nodeName.toLowerCase());

          return groupItem;
        });

        var groupsLenth = groups.length;

        this.listOptions = this._selectOptions.map(function (option, index) {
          var item = document.createElement('li');

          item.setAttribute('role', 'option');
          item.setAttribute('id', (_this._select.name || _this._options.name) + '-' + index);

          if (groupsLenth) {
            item.setAttribute('aria-setsize', optionsLength);
            item.setAttribute('aria-posinset', index + 1);
          }

          if (index === _this.selectedIndex) {
            item.setAttribute('aria-selected', 'true');
          }

          item.innerHTML = _this._options.template(option.label, option.nodeName.toLowerCase());

          if (option.parentElement.nodeName === 'OPTGROUP') {
            var group = groups[_this._selectGroups.indexOf(option.parentElement)];

            group.children[1].appendChild(item);

            if (!_this._listbox.contains(group)) {
              _this._listbox.appendChild(group);
            }
          } else {
            _this._listbox.appendChild(item);
          }

          return item;
        });
      }
    }, {
      key: '_focus',
      value: function _focus(dir) {
        var nextSelectedIndex = this._activeIndex + dir;
        var maxIndex = this.listOptions.length - 1;

        if (nextSelectedIndex < 0) {
          nextSelectedIndex = maxIndex;
        } else if (nextSelectedIndex > maxIndex) {
          nextSelectedIndex = 0;
        }

        var nextOption = this.listOptions[nextSelectedIndex];
        var lastOption = this.listOptions[this._activeIndex];

        lastOption.classList.remove(this._options.activeClass);
        lastOption.removeAttribute('tabindex');

        nextOption.classList.add(this._options.activeClass);

        nextOption.setAttribute('tabindex', -1);

        nextOption.focus();

        this._listbox.setAttribute('aria-activedescendant', nextOption.id);

        this._activeIndex = nextSelectedIndex;
      }
    }, {
      key: '_getMaxWidth',
      value: function _getMaxWidth() {
        this._listbox.style.visibility = 'hidden';
        this._listbox.style.display = 'block';
        this._listbox.style.width = 'auto';
        this.width = this._listbox.clientWidth;
        this._listbox.removeAttribute('style');

        this._button.firstElementChild.style.width = this.width + 'px';
      }
    }, {
      key: '_handleChange',
      value: function _handleChange() {
        this.selectedIndex = this._select.selectedIndex;
      }
    }, {
      key: '_handleClick',
      value: function _handleClick(event) {
        if (event.detail !== 1) {
          return;
        }

        if (this._button.contains(event.target)) {
          this._handleExpand();

          return;
        }

        if (this._listbox.contains(event.target)) {
          this._handleSelection(event);

          return;
        }
      }
    }, {
      key: '_handleClose',
      value: function _handleClose(event) {
        if (this._root.contains(event.target)) {
          return;
        }

        this._handleExpand(false);
      }
    }, {
      key: '_handleExpand',
      value: function _handleExpand(expandedState) {
        var expanded = expandedState !== undefined ? !expandedState : this._button.getAttribute('aria-expanded') === 'true';

        this._button.setAttribute('aria-expanded', !expanded);
        this._listbox.setAttribute('aria-hidden', expanded);

        var activeOption = this.listOptions[this._activeIndex];

        activeOption.classList.toggle(this._options.activeClass, !expanded);

        if (!expanded) {
          activeOption.removeAttribute('tabindex');
        }
      }
    }, {
      key: '_handleKey',
      value: function _handleKey(event) {
        if (allowedKeyCodes.indexOf(event.keyCode) === -1) {
          return;
        }

        event.preventDefault();

        // close the listbox
        if (event.keyCode === 27) {
          this._handleExpand(false);
          this._button.focus();

          return;
        }

        // enter
        if (event.keyCode === 13) {
          if (this._button.contains(event.target)) {
            this._handleExpand();
            this._listbox.focus();

            return;
          }

          this._selectIndex(this._activeIndex);

          return;
        }

        // spacebar
        if (event.keyCode === 32 && !this._button.contains(event.target)) {
          if (this.multiple) {
            this._toggleOption(this.listOptions[this._activeIndex], this._activeIndex);
          } else {
            this.selectedIndex = this._activeIndex;
          }

          return;
        }

        // arrows
        if (event.keyCode >= 37 && event.keyCode <= 40) {
          if (this._button.contains(event.target)) {
            this._handleExpand();
            this._listbox.focus();

            return;
          }

          // move the focus
          this._focus(event.keyCode < 39 ? -1 : 1);

          return;
        }
      }
    }, {
      key: '_handleSelection',
      value: function _handleSelection(event) {
        var selectedIndex = this.listOptions.findIndex(function (el) {
          return el.contains(event.target);
        });

        if (selectedIndex < 0) {
          return;
        }

        this._selectIndex(selectedIndex);
      }
    }, {
      key: '_parse',
      value: function _parse() {
        this._selectOptions = Array.prototype.slice.call(this._select.options);

        this.size = this._select.size;
        this.multiple = this._select.multiple;
        this._selectedIndex = this._select.selectedIndex;
        this._activeIndex = this._selectedIndex < 0 ? 0 : this._selectedIndex;
        this.label = document.querySelector('[for=' + this._select.id + ']');

        if (this.label && !this.label.id) {
          this.label.setAttribute('id', this._select.name + '-label');
        }

        this._selectGroups = Array.prototype.slice.call(this._select.querySelectorAll('optgroup'));
      }
    }, {
      key: '_selectIndex',
      value: function _selectIndex(index) {
        if (this.multiple) {
          this._toggleOption(this.listOptions[index], index);

          return;
        }

        this.selectedIndex = index;
        this._handleExpand(false);
        this._button.focus();
      }
    }, {
      key: '_template',
      value: function _template(label) {
        return label;
      }
    }, {
      key: '_toggleOption',
      value: function _toggleOption(option, index) {
        var selected = option.hasAttribute('aria-selected');

        if (!selected) {
          this.selectedIndex = index;

          return;
        }

        option.removeAttribute('aria-selected');
      }
    }, {
      key: 'options',
      get: function get$$1() {
        return this._selectOptions;
      }
    }, {
      key: 'selectedIndex',
      get: function get$$1() {
        return this._selectedIndex;
      },
      set: function set$$1(index) {
        if (!this.listOptions) {
          return;
        }

        if (!this.multiple) {
          this.listOptions[this._selectedIndex].removeAttribute('aria-selected');
        }

        this._select.selectedIndex = index;
        this._selectedIndex = index;

        this.listOptions[this._select.selectedIndex].setAttribute('aria-selected', 'true');

        var label = this._options.template(this.selectedIndex > -1 ? this._selectOptions[this.selectedIndex].label : '', 'button');

        this._button.firstElementChild.innerHTML = label;
      }
    }]);
    return Select;
  }();

  return Select;

})));
