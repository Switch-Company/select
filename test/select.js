/* eslint-env node */
'use strict';

const test = require( 'tape' );
const puppeteer = require( 'puppeteer' );
const path = `file://${__dirname}/select.html`;

const createBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();

  await page.goto( path );

  return [ browser, page ];
};

function mount( selector ){
  return async t => {

    const [ browser, page ] = await createBrowser();

    const result = await page.evaluate( selector => {

      const select = document.querySelector( selector );
      const selectEl = select.querySelector( 'select' );
      const label = document.querySelector( `[for="${selectEl.id}"]` );

      const button = select.querySelector( 'button[aria-haspopup="listbox"]' );

      const list = select.querySelector( '[role="listbox"]' );

      const optionsLength = selectEl.options.length;
      const selectedIndex = selectEl.selectedIndex;
      const optgroups = Array.from( selectEl.querySelectorAll( 'optgroup' ));
      const generatedGroups = Array.from( select.querySelectorAll( '[role="group"]' ));
      const generatedOptions = Array.from( select.querySelectorAll( '[role="option"]' ));

      const matchGroup = optgroups.length === 0 ? null : generatedGroups.every(( el, index ) => {
        const optgroup = optgroups[ index ];
        const label = document.getElementById( el.getAttribute( 'aria-labelledby' ));

        return label !== null && optgroup !== null && label.textContent === optgroup.label;
      });

      return {
        button: {
          exists: button !== null,
          expanded: button.getAttribute( 'aria-expanded' ),
          label: list !== null && list.getAttribute( 'aria-labelledby' )
        },
        list: {
          exists: list !== null,
          tabindex: list !== null && list.getAttribute( 'tabindex' ),
          hidden: list !== null && list.getAttribute( 'aria-hidden' ),
          multiple: {
            test: selectEl.multiple,
            value: list !== null && list.getAttribute( 'aria-multiselectable' ) === 'true'
          },
          label: list !== null && list.getAttribute( 'aria-labelledby' )
        },
        options: {
          length: {
            test: optionsLength,
            value: generatedOptions.length,
          },
          selectedIndex: {
            test: selectedIndex,
            value: generatedOptions.indexOf( select.querySelector( '[aria-selected="true"]' ))
          },
          group: {
            exists: generatedGroups.length > 0,
            valid: matchGroup
          }
        },
        label: {
          exists: label !== null,
          id: label !== null && label.id
        }
      };
    }, selector );

    t.true( result.button.exists, 'Le bouton ouvrant la liste est présent' );
    t.same( result.button.expanded, 'false', 'Le bouton a la valeur `false` pour l’attribut `aria-expanded`' );

    t.true( result.list.exists, 'La liste représentant le select est présent' );
    t.same( result.list.tabindex, '-1', 'La liste a la valeur `-1`pour l’attribut `aria-expanded`' );
    t.same( result.list.hidden, 'true', 'La liste a la valeur `true`pour l’attribut `aria-hidden`' );
    t.same( result.list.multiple.test, result.list.multiple.value, 'L’attribut `aria-multiselectable` de la liste respecte l’attribut `multiple` du select' );

    t.same( result.options.length.test, result.options.length.value, 'La liste comporte le bon nombre d’options' );
    t.same( result.options.selectedIndex.test, result.options.selectedIndex.value, 'L’option selectionné est la bonne' );

    if( result.options.group.exists ){
      t.true( result.options.group.exists, 'Le groupe représentant optgroup est présent' );
      t.true( result.options.group.valid, 'Le groupe a le bon label' );
    }

    if( result.label.exists ){
      t.same( result.button.label, result.label.id, 'Le bouton est lié au label du select via l’attribut `aria-labelledby`' );
      t.same( result.list.label, result.label.id, 'La liste est lié au label du select via l’attribut `aria-labelledby`' );
    }

    await browser.close();

    t.end();
  };
}

// function open( selector ){}

function selectClick( selector ){
  return async t => {
    const [ browser, page ] = await createBrowser();

    await page.click( `${selector} button` );
    await page.click( `${selector} [id^="select"][id*="-2"]` );

    const result = await page.evaluate( selector => {

      const selectRoot = document.querySelector( selector );
      const select = selectRoot.select;
      const selectEl = selectRoot.querySelector( 'select' );
      const button = selectRoot.querySelector( '[aria-haspopup="listbox"]' );
      const list = selectRoot.querySelector( '[role="listbox"]' );

      return {
        selectedIndex: selectEl.selectedIndex === select.selectedIndex && select.selectedIndex === 2,
        multiple: select.multiple,
        list: {
          closed: list.getAttribute( 'aria-hidden' ) === 'true'
        },
        button: {
          focus: document.activeElement === button,
          closed: button.getAttribute( 'aria-expanded' ) === 'false',
          label: {
            test: selectEl.options[ selectEl.selectedIndex ].label,
            value: button.firstElementChild.textContent
          }
        }
      };

    }, selector );

    let toggleOption;

    if( result.multiple ){
      await page.click( `${selector} [id^="select"][id*="-1"]` );
      await page.click( `${selector} [id^="select"][id*="-2"]` );

      toggleOption = await page.evaluate( selector => {
        const selectRoot = document.querySelector( selector );

        const toggledOption = selectRoot.querySelector( '[id^="select"][id*="-2"]' );
        const selectedOptions = Array.from( selectRoot.querySelectorAll( '[aria-selected="true"]' ));

        return selectedOptions.includes( toggledOption );
      }, selector );
    }

    t.true( result.selectedIndex, 'L’attribut `selectedIndex` est à jour par rapport à l’option cliquée' );

    if( result.multiple ){
      t.false( result.list.closed, 'La liste n’est pas fermée après avoir sélectionné une option' );
      t.false( toggleOption, 'Un clic sur une option déjà sélectionné la désélectionne' );
    }
    else{
      t.true( result.list.closed, 'La liste est fermée après avoir sélectionné une option' );
      t.true( result.button.focus, 'Le focus est replacé sur le bouton après avoir sélectionné une option' );
      t.true( result.button.closed, 'L’attribut `aria-expanded` est remis à `false`' );
      t.same( result.button.label.test, result.button.label.value, 'Le label du bouton est le même que celui de l’option sélectionnée' );
    }

    await browser.close();

    t.end();
  };
}

function externalClick( selector ){
  return async t => {
    const [ browser, page ] = await createBrowser();

    await page.click( `${selector} button` );
    await page.click( 'body' );

    const bodyClick = await page.evaluate( selector => {
      const selectRoot = document.querySelector( selector );
      const button = selectRoot.querySelector( '[aria-haspopup="listbox"]' );
      const list = selectRoot.querySelector( '[role="listbox"]' );

      return {
        button: button.getAttribute( 'aria-expanded' ) === 'false',
        list: list.getAttribute( 'aria-hidden' ) === 'true'
      };

    }, selector );

    await page.click( `${selector} button` );
    await page.click( '#select2 + button' );

    const selectClick = await page.evaluate( selector => {
      const selectRoot = document.querySelector( selector );
      const button = selectRoot.querySelector( '[aria-haspopup="listbox"]' );
      const list = selectRoot.querySelector( '[role="listbox"]' );

      return {
        button: button.getAttribute( 'aria-expanded' ) === 'false',
        list: list.getAttribute( 'aria-hidden' ) === 'true'
      };

    }, selector );



    t.true( bodyClick.button, 'Un click en dehors du select passe `aria-expanded` à `false` sur le bouton' );
    t.true( bodyClick.list, 'Un click en dehors du select passe `aria-hidden` à `true` sur la liste' );

    t.true( selectClick.button, 'Un click sur un autre select passe `aria-expanded` à `false` sur le bouton' );
    t.true( selectClick.list, 'Un click sur un autre select passe `aria-hidden` à `true` sur la liste' );

    await browser.close();

    t.end();
  };
}

function selectKeyboard( selector ){
  return async t => {
    const [ browser, page ] = await createBrowser();

    await page.focus( `${selector} button` );
    await page.keyboard.press( 'ArrowDown' );
    await page.keyboard.press( 'ArrowDown' );
    await page.keyboard.press( 'ArrowDown' );

    const selection = await page.evaluate( selector => {
      const selectRoot = document.querySelector( selector );
      const list = selectRoot.querySelector( '[role="listbox"]' );
      const activeOption = selectRoot.querySelector( '[id^="select"][id*="-2"]' );

      return {
        activeDescendant: list.getAttribute( 'aria-activedescendant' ) === activeOption.id,
        focused: document.activeElement === activeOption
      };
    }, selector );

    await page.keyboard.press( 'Enter' );

    const result = await page.evaluate( selector => {

      const selectRoot = document.querySelector( selector );
      const select = selectRoot.select;
      const selectEl = selectRoot.querySelector( 'select' );
      const button = selectRoot.querySelector( '[aria-haspopup="listbox"]' );
      const list = selectRoot.querySelector( '[role="listbox"]' );

      return {
        selectedIndex: selectEl.selectedIndex === select.selectedIndex && select.selectedIndex === 2,
        multiple: select.multiple,
        list: {
          closed: list.getAttribute( 'aria-hidden' ) === 'true'
        },
        button: {
          focus: document.activeElement === button,
          closed: button.getAttribute( 'aria-expanded' ) === 'false',
          label: {
            test: selectEl.options[ selectEl.selectedIndex ].label,
            value: button.firstElementChild.textContent
          }
        }
      };

    }, selector );

    t.true( result.selectedIndex, 'L’attribut `selectedIndex` est à jour par rapport à l’option cliquée' );
    t.true( selection.activeDescendant, 'La liste indique l’élément actif via `aria-activedescendant`' );
    t.true( selection.focused, 'L’élément actif à le focus' );

    if( result.multiple ){
      t.false( result.list.closed, 'La liste n’est pas fermée après avoir sélectionné une option' );
    }
    else{
      t.true( result.list.closed, 'La liste est fermée après avoir sélectionné une option' );
      t.true( result.button.focus, 'Le focus est replacé sur le bouton après avoir sélectionné une option' );
      t.true( result.button.closed, 'L’attribut `aria-expanded` est remis à `false`' );
      t.same( result.button.label.test, result.button.label.value, 'Le label du bouton est le même que celui de l’option sélectionnée' );
    }

    await browser.close();

    t.end();
  };
}

test( 'Mount optgroup', mount( 'form div:nth-of-type(1) span.select' ));
test( 'Mount simple', mount( 'form div:nth-of-type(2) span.select' ));
test( 'Mount multiple', mount( 'form div:nth-of-type(3) span.select' ));

// test( 'Open optgroup', open( 'form div:nth-of-type(1) span.select' ));
// test( 'Open simple', open( 'form div:nth-of-type(2) span.select' ));
// test( 'Open multiple', open( 'form div:nth-of-type(3) span.select' ));

test( 'Select with mouse optgroup', selectClick( 'form div:nth-of-type(1) span.select' ));
test( 'Select with mouse simple', selectClick( 'form div:nth-of-type(2) span.select' ));
test( 'Select with mouse multiple', selectClick( 'form div:nth-of-type(3) span.select' ));

test( 'External click', externalClick( 'form div:nth-of-type(1) span.select' ));

test( 'Select with keyboard optgroup', selectKeyboard( 'form div:nth-of-type(1) span.select' ));
test( 'Select with keyboard simple', selectKeyboard( 'form div:nth-of-type(2) span.select' ));
test( 'Select with keyboard multiple', selectKeyboard( 'form div:nth-of-type(3) span.select' ));
