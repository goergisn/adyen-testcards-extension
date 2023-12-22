// suffix displaying 3DS support
const THREE_DS_SUFFIX = " (3DS)";

// name objects on local storage
const CARDS_LIST = "cards-list"
const GIFTCARDS_LIST = "giftcards-list"
const IBANS_LIST = "ibans-list"

let cards = [];
let giftcards = [];
let ibans = [];

$("#search").on("keyup", function () {
  // filter criteria
  var criteria = $(this).val().toLowerCase();

  $(".searchable").each(function (i, card) {
    // filter: hide rows that don't match the criteria
    $(card).toggle($(card).text().toLowerCase().indexOf(criteria) > -1)
    // hide divs containing empty tables (ie don't show empty sections)
    var table = $(card).closest('table');
    var numVisibleRows = table.find('tr').filter(function() {
      return $(this).css('display') !== 'none';
    }).length;
    if (numVisibleRows === 0) {
      $(card).closest('div.cardnumbers').hide();
    } else {
      $(card).closest('div.cardnumbers').show();
    }
  });

});

// load content of the panel
async function load() {

  cards = await getFromStorage(CARDS_LIST);

  if (cards == undefined) {
    // first time: load from json file
    cards = await loadFromFile("data/cards.json");
    await setInStorage(CARDS_LIST, cards);
  }

  giftcards = await getFromStorage(GIFTCARDS_LIST);

  if (giftcards == undefined) {
    // first time: load from json file
    giftcards = await loadFromFile("data/giftcards.json");
    await setInStorage(GIFTCARDS_LIST, giftcards);
  }

  ibans = await getFromStorage(IBANS_LIST);

  if (ibans == undefined) {
    // first time: load from json file
    ibans = await loadFromFile("data/ibans.json");
    await setInStorage(IBANS_LIST, ibans);
  }

  var outerdiv = $('<div>');

  // favourites section
  outerdiv.append(createFavourites());
  // cards section
  outerdiv.append(createCards());
  // giftcards section
  outerdiv.append(createGiftCards());
  // ibans section
  outerdiv.append(createIbans());

  $('#cards').html(outerdiv);
}

// render cards section
function createCards() {

  var divs = []

  // all cards section
  $.each(cards, function (index, item) {

    var div = $('<div>').addClass("cardnumbers");
    var h3 = $('<h3>').addClass("sectionTitle").text(item.group);

    const cards = createCardsBrandSection(item.group, item.items);
    if (cards != undefined) {
      // show section when not empty (i.e. all cards are in the favourites section)
      div.append(h3);
      div.append(cards);

      divs.push(div);
    } 
  });

  return divs;
}

// render favourites section
// find favourites in cards, giftcards, ibans, etc..
function createFavourites() {

  var divFavourites = $('<div>').addClass("cardnumbers");

  // Favourites title and helper messages
  var divFavouritesContainer = $('<div>').addClass("divFavouritesContainer");
  var h3 = $('<h3>').addClass("sectionTitle").text("Favourites");
  // message when hovering over text
  var copyToClipboardMessageSpan = $('<span>').attr('id', 'copyToClipboardMessageSpanId').addClass("hidden").text("Click to copy in the clipboard");
  // message when text is copied
  var textIsCopiedMessageSpan = $('<span>').attr('id', 'textIsCopiedMessageSpanId').addClass("hidden").html("Copied &#x2705;");
  divFavouritesContainer.append(h3, copyToClipboardMessageSpan, textIsCopiedMessageSpan);

  divFavourites.append(divFavouritesContainer);

  let numFavs = 0;

  // find favourite cards
  var table = $('<table>').attr("id", "tableFavouritesId");

  $.each(cards, function (index, item) {

    const logo = item.logo;
    const group = item.group;

    $.each(item.items, function (index, item) {

      if (item.favourite) {
        numFavs++;

        var row = $('<tr>');
        var tdIcon = ($('<td>').append(makeCardUnfavIcon(item.cardnumber)));

        var cardnumber = item.cardnumber;
        if (item.secure3DS) {
          // add suffix when card flow supports 3DS ie 3714 4963 5398 431 (3DS)
          cardnumber = cardnumber + THREE_DS_SUFFIX;
        } 
        var tdNumber = $('<td>').addClass("tdCardNumber").text(cardnumber);
        addCopyHandlers(tdNumber);

        var tdExpiry = ($('<td>').addClass("tdExpiry").text(item.expiry));
        addCopyHandlers(tdExpiry);
        var tdCode = ($('<td>').addClass("tdCode").text(item.CVC));
        addCopyHandlers(tdCode);
        var tdLogo = ($('<td>').addClass("center").addClass(logo).attr('title', group));
        var tdLinks = ($('<td>').addClass("center").append(createLinks("card")));
        row.append(tdIcon).append(tdNumber).append(tdExpiry).append(tdCode).append(tdLogo).append(tdLinks);
        table.append(row);
      }
      divFavourites.append(table);
    })
  });

  // find favourite giftcards
  $.each(giftcards, function (index, item) {

    const logo = item.logo;

    if (item.favourite) {
      numFavs++;

      var row = $('<tr>').addClass("searchable");
      var tdIcon = ($('<td>').append(makeGiftCardUnfavIcon(item.cardnumber)));
      var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.cardnumber));
      addCopyHandlers(tdNumber);
      var tdCode = ($('<td colspan="2">').addClass("center").addClass("tdCode").text(item.code));
      addCopyHandlers(tdCode);
      var tdLogo = ($('<td>').addClass("center").addClass(logo).attr('title', item.type));
      var tdLinks = ($('<td>').addClass("center").append(createLinks("giftcard")));
      row.append(tdIcon).append(tdNumber).append(tdCode).append(tdLogo).append(tdLinks);
      table.append(row);
    }
    divFavourites.append(table);
  });

  // find favourite IBANs
  $.each(ibans, function (index, item) {
    if (item.favourite) {
      numFavs++;

      var row = $('<tr>').addClass("searchable");
      var tdIcon = ($('<td>').append(makeIbanUnfavIcon(item.iban)));
      var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.iban));
      addCopyHandlers(tdNumber);
      var tdCode = ($('<td colspan="2">').addClass("center").addClass("tdExpiry").text(item.name));  // note: use expiry column for IBAN account holder
      addCopyHandlers(tdCode);
      var tdLogo = ($('<td>').addClass("center").text("IBAN"));
      var tdLinks = ($('<td>').addClass("center").append(createLinks("iban")));
      row.append(tdIcon).append(tdNumber).append(tdCode).append(tdLogo).append(tdLinks);
      table.append(row);
    }
    divFavourites.append(table);
  });

  if (numFavs == 0) {
    // empty section
    var text = $('<em>').text("Add favourites if you like :-)");
    divFavourites.append(text);
  }

  return divFavourites;
}

// add handlers (hover, click, etc..)
function addCopyHandlers(element) {
  // make it copyable
  element.addClass("copyable");
  // set handlers
  element.hover(onHoverHandler).click(copyToClipboardHandler)
}

// when hovering over copiable text
// display helper message
function onHoverHandler() {
  $(this).hover(function() {
    if($('#textIsCopiedMessageSpanId').is(':visible')) {
      return;
    }
    $('#copyToClipboardMessageSpanId').show();
  }, function() {
    $('#copyToClipboardMessageSpanId').hide();
  });
}

// when copying into the clipboard
function copyToClipboardHandler() {
  var value = $(this).text().trim();
  // remove suffix (if found)
  value = value.replace(THREE_DS_SUFFIX, "")
  copyToClipboard(value);

   // Show the message
   $('#textIsCopiedMessageSpanId').show();
   // Hide other message 
   $('#copyToClipboardMessageSpanId').hide();

   // Hide after x seconds
   setTimeout(function() {
    $('#textIsCopiedMessageSpanId').hide()
   }, 1000 * 2);
}

// add card to favourites
function makeCardFav(cardnumber) {

  // find card number and mark as fav
  for (let i = 0; i < cards.length; i++) {
    let items = cards[i].items;

    for (let j = 0; j < items.length; j++) {
      let item = items[j];
      if (item.cardnumber === cardnumber) {
        item.favourite = true;
      }
    }
  }

  // save to storage and reload
  setInStorage(CARDS_LIST, cards);
  load();
}

// remove card from favourites
function makeCardUnfav(cardnumber) {

  // find card number and mark as not fav  
  for (let i = 0; i < cards.length; i++) {
    let items = cards[i].items;

    for (let j = 0; j < items.length; j++) {
      let item = items[j];
      if (item.cardnumber === cardnumber) {
        item.favourite = false;
      }
    }
  }

  // save to storage and reload
  setInStorage(CARDS_LIST, cards);
  load();
}

// add giftcard to favourites
function makeGiftCardFav(cardnumber) {

  // find giftcard number and mark as fav
  for (let j = 0; j < giftcards.length; j++) {
    let item = giftcards[j];
    if (item.cardnumber === cardnumber) {
      item.favourite = true;
    }
  }

  // save to storage and reload
  setInStorage(GIFTCARDS_LIST, giftcards);
  load();
}

// remove giftcard from favourites
function makeGiftCardUnfav(cardnumber) {

  // find giftcard number and mark as not fav
  for (let j = 0; j < giftcards.length; j++) {
    let item = giftcards[j];
    if (item.cardnumber === cardnumber) {
      item.favourite = false;
    }
  }

  // save to storage and reload
  setInStorage(GIFTCARDS_LIST, giftcards);
  load();
}

// add IBAN to favourites
function makeIbanFav(iban) {

  // find IBAN number and mark as fav
  for (let j = 0; j < ibans.length; j++) {
    let item = ibans[j];
    if (item.iban === iban) {
      item.favourite = true;
    }
  }

  // save to storage and reload
  setInStorage(IBANS_LIST, ibans);
  load();
}

// removed IBAN from favourites
function makeIbanUnfav(iban) {

  // find IBAN number and mark as not fav
  for (let j = 0; j < ibans.length; j++) {
    let item = ibans[j];
    if (item.iban === iban) {
      item.favourite = false;
    }
  }

  // save to storage and reload
  setInStorage(IBANS_LIST, ibans);
  load();
}

// render brand of cards
function createCardsBrandSection(brand, cards) {

  let numCards = 0;

  var table = $('<table>');
  $.each(cards, function (index, item) {

    if (!item.favourite) {
      numCards++;

      var row = $('<tr>').addClass("searchable");
      var tdIcon = ($('<td>').append(makeCardFavIcon(item.cardnumber)));
      if (item.secure3DS) {
        // add suffix when card flow supports 3DS ie 3714 4963 5398 431 (3DS)
        var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.cardnumber + THREE_DS_SUFFIX));
        // add hidden cell to allow filtering on content (cardnumber, brand, etc..)
        var tdHidden = ($('<td>').addClass("hidden").text(brand + " " + item.cardnumber + THREE_DS_SUFFIX));
      } else {
        var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.cardnumber));
        // add hidden cell to allow filtering on content (cardnumber, brand, etc..)
        var tdHidden = ($('<td>').addClass("hidden").text(brand + " " + item.cardnumber));
      }
      addCopyHandlers(tdNumber);
      var tdExpiry = ($('<td>').addClass("center").addClass("tdExpiry").text(item.expiry));
      addCopyHandlers(tdExpiry);
      var tdCode = ($('<td>').addClass("center").addClass("tdCode").text(item.CVC));
      addCopyHandlers(tdCode);
      var tdLinks = ($('<td>').addClass("center").append(createLinks("card")));
      row.append(tdHidden).append(tdIcon).append(tdNumber).append(tdExpiry).append(tdCode).append(tdLinks);
      table.append(row);
    }
  });

  if (numCards > 0) {
    return table;
  } else {
    return undefined;
  }
}

// render giftcards
function createGiftCards() {

  var divGiftCards = $('<div>').addClass("cardnumbers");
  var h3 = $('<h3>').addClass("sectionTitle").text("Gift cards");
  divGiftCards.append(h3);

  let numCards = 0;

  var table = $('<table>');
  $.each(giftcards, function (index, item) {

    if (!item.favourite) {
      numCards++;

      var row = $('<tr>').addClass("searchable");
      // add hidden cell to allow filtering on content (number, code, etc..)
      var tdHidden = ($('<td>').addClass("hidden").text("giftcards " + item.cardnumber + " " + item.type));
      var tdIcon = ($('<td>').append(makeGiftCardFavIcon(item.cardnumber)));
      var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.cardnumber));
      addCopyHandlers(tdNumber);
      var tdType = ($('<td>').addClass("tdType").text(item.type));
      var tdCode = ($('<td>').addClass("center").addClass("tdCode").text(item.code));
      addCopyHandlers(tdCode)
      var tdLinks = ($('<td>').addClass("center").append(createLinks("giftcard")));
      row.append(tdHidden).append(tdIcon).append(tdNumber).append(tdType).append(tdCode).append(tdLinks);
      table.append(row);
    }
  });
  divGiftCards.append(table);

  if (numCards > 0) {
    return divGiftCards;
  } else {
    return undefined;
  }
}

// render ibans
function createIbans() {

  var divIbans = $('<div>').addClass("cardnumbers");
  var h3 = $('<h3>').addClass("sectionTitle").text("IBANs");
  divIbans.append(h3);

  let numCards = 0;

  var table = $('<table>');
  $.each(ibans, function (index, item) {

    if (!item.favourite) {
      numCards++;

      var row = $('<tr>').addClass("searchable");
      // add hidden cell to allow filtering on content (number, name, etc..)
      var tdHidden = ($('<td>').addClass("hidden").text("ibans " + item.iban + " " + item.name));
      var tdIcon = ($('<td>').append(makeIbanFavIcon(item.iban)));
      var tdNumber = ($('<td>').addClass("tdCardNumber").text(item.iban));
      addCopyHandlers(tdNumber);
      var tdName = ($('<td>').addClass("tdExpiry").text(item.name));  // note: use expiry column for IBAN account holder
      addCopyHandlers(tdName)
      var tdLinks = ($('<td>').addClass("center").append(createLinks("iban")));
      row.append(tdHidden).append(tdIcon).append(tdNumber).append(tdName).append(tdLinks);
      table.append(row);
    }
  });
  divIbans.append(table);

  if (numCards > 0) {
    return divIbans;
  } else {
    return undefined;
  }
}

// icon to add card in favourites
function makeCardFavIcon(cardnumber) {
  var div = $('<div>').attr("id", sanitize(cardnumber)).addClass("fav-icon");

  div.on('click', function () {
    makeCardFav(cardnumber);
  });

  return div;
}

// icon to remove card from favourites
function makeCardUnfavIcon(cardnumber) {
  var div = $('<div>').attr("id", sanitize(cardnumber)).addClass("unfav-icon");

  div.on('click', function () {
    makeCardUnfav(cardnumber);
  });

  return div;
}

// icon to add giftcard in favourites
function makeGiftCardFavIcon(cardnumber) {
  var div = $('<div>').addClass("fav-icon");

  div.on('click', function () {
    makeGiftCardFav(cardnumber);
  });

  return div;
}

// icon to remove giftcard from favourites
function makeGiftCardUnfavIcon(cardnumber) {
  var div = $('<div>').addClass("unfav-icon");

  div.on('click', function () {
    makeGiftCardUnfav(cardnumber);
  });

  return div;
}

// icon to add IBAN in favourites
function makeIbanFavIcon(iban) {
  var div = $('<div>').addClass("fav-icon");

  div.on('click', function () {
    makeIbanFav(iban);
  });

  return div;
}

// icon to remove IBAN from favourites
function makeIbanUnfavIcon(iban) {
  var div = $('<div>').addClass("unfav-icon");

  div.on('click', function () {
    makeIbanUnfav(iban);
  });

  return div;
}

// create action links (copy, prefill)   
function createLinks(type) {
  return $('<div>').addClass("actionLinks").append("&nbsp;&nbsp;&nbsp;").append(createPrefillLink(type));
}

function createCopyLink() {
  const anchor = $('<a>');
  anchor.addClass("copyLinkClick");
  anchor.attr('href', "a");
  anchor.text("Copy");
  anchor
    .click(
      function (evt) {
        evt.preventDefault();
        var cardNumberTd = $(this).closest("tr").find("td.tdCardNumber");
        // remove suffix (if found)
        var value = cardNumberTd.text().replace(THREE_DS_SUFFIX, "")

        copyToClipboard(value);
      }
    );

  return anchor
}


// create prefill link based on type (card, giftcard, iban, etc..)
function createPrefillLink(type) {
  const anchor = $('<a>');
  anchor.addClass("copyPrefillClick");
  anchor.attr('href', "a");
  anchor.text("Prefill");
  anchor
    .click(
      async function (evt) {
        evt.preventDefault();
        var cardNumberTd = $(this).closest("tr").find("td.tdCardNumber");
        // remove suffix (if found)
        var cardNumberTdValue = cardNumberTd.text().replace(THREE_DS_SUFFIX, "")
        var expiryTd = $(this).closest("tr").find("td.tdExpiry");
        var codeTd = $(this).closest("tr").find("td.tdCode");

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          var activeTab = tabs[0];
          // inject js script to be run inside the active tab
          // must be injected to be able to access/update DOM
          chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id, allFrames: true },
              func: prefillCardComponent,
              args: [type, cardNumberTdValue, expiryTd.text(), codeTd.text()]
            }
          )
        });
      }
    );
  return anchor
}

async function copyToClipboard(val) {
  await navigator.clipboard.writeText(val)
}

// find and prefill form input fields (based on type)
function prefillCardComponent(type, cardNumberTd, expiryTd, codeTd) {

  if (type === "card" || type == "giftcard") {
    var cardnumber = document.querySelector('input[id^="adyen-checkout-encryptedCardNumber-"]');

    if (cardnumber != null) {
      cardnumber.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, cardNumberTd);
    }
  }

  if (type === "card") {
    var expiry = document.querySelector('input[id^="adyen-checkout-encryptedExpiryDate-"]');

    if (expiry != null) {
      expiry.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, expiryTd);
    }
  }

  if (type === "card" || type == "giftcard") {
    var code = document.querySelector('input[id^="adyen-checkout-encryptedSecurityCode-"]');

    if (code != null) {
      if (codeTd === "None") {
        // replace None placeholder with empty code
        codeTd = "";
      }
      code.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, codeTd);
    }
  }

  if (type === "card") {
    var holder = document.querySelector('input[id^="adyen-checkout-holderName-"]');

    if (holder != null) {
      holder.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, "J. Smith");
    }
  }

  if (type === "card") {
    // prefill expiryMonth (for custom card implementation)
    var expiryMonth = document.querySelector('input[id^="adyen-checkout-encryptedExpiryMonth-"]');

    if (expiryMonth != null) {
      expiryMonth.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, expiryTd.slice(0, 2));
    }
  }

  if (type === "card") {
    // prefill expiryYear (for custom card implementation)
    var expiryYear = document.querySelector('input[id^="adyen-checkout-encryptedExpiryYear-"]');

    if (expiryYear != null) {
      expiryYear.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, expiryTd.slice(-2));
    }
  }

  // prefill IBAN
  if (type === "iban") {
    var ibanNumber = document.querySelector('input[name^="ibanNumber"]');

    if (ibanNumber != null) {
      ibanNumber.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, cardNumberTd);
    }
  }

  if (type === "iban") {
    // prefill IBAN holder name
    var name = document.querySelector('input[name^="ownerName"]');
    
    if (name != null) {
      name.focus({ focusVisible: true });
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, expiryTd);
    }
  }

}

// save cards in local storage
async function setInStorage(name, value) {
  await chrome.storage.local.set({ [name]: value });
}

// get cards from local storage
async function getFromStorage(name) {
  let cards = await chrome.storage.local.get([name]);

  return cards[name];
}

// load from json file
async function loadFromFile(filename) {
  console.log("loadFromFile " + filename);
  const res = await fetch(chrome.runtime.getURL(filename));
  const obj = await res.json()
  return obj;
}

// replace space with underscore
function sanitize(str) {
  return str.replace(/ /g, '_');
}

document.addEventListener('DOMContentLoaded', function () {
  load();
});

