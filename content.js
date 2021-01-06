// add feature image as a background
// shrink the feature image to content width by removing class
function adjust_feature_img() {
    var product = document.getElementsByClassName('product-single');
    var content = product[0].getElementsByClassName('main-content-block')[0];
    var clonedImg = product[0].getElementsByClassName('feature-image')[0].cloneNode(true);
    clonedImg.classList.remove("feature-image");
    clonedImg.id = "od-feature-img";
    content.prepend(clonedImg);
}

// move size chart up to under the size selection
function move_size_chart() {
    var product = document.getElementsByClassName('product-single');
    var content = product[0].getElementsByClassName('main-content-block')[0];
    content.appendChild(document.getElementsByClassName('sizechart')[0].cloneNode(true));
}

// grab bisVariants from the html 
// hack some regex
// show in the UI
function show_stock_counts(){
    var content = document.body.textContent || document.body.innerText;
    var variantText = '{"data": ' +
        content.substring(content.indexOf("bisVariants"), content.length).match("\\[[^\\]]*]") + ' }';
    variantText = variantText.replaceAll(/[{]/g,"{\n  ").replaceAll(/[}]/g,"    \n}")
        .replaceAll(/([a-zA-Z0-9-_]+): ([a-zA-Z0-9-]+)/g, "\"$1\":\"$2\"")
        .replaceAll(/([a-zA-Z0-9-_]+): ("[a-zA-Z0-9- \/"]+)/g, "\"$1\":$2");
    var variants = JSON.parse(variantText);

    var cartForm = document.getElementsByClassName('AddToCartForm')[0];
    variants.data.forEach(stock => {
        var el = cartForm.querySelector('[for="add_'+ stock['id'] +'"]');
        if (el) {
            el.innerText = el.innerText.trim().substring(el.innerText.trim().indexOf("\n") + 1);
            el.innerHTML = el.innerHTML + '<span class="stonks">(' + stock['qty'] + ')</span>';
        }
    });
}

// strip color carousel feature
function dismantle_color_carousel() {
    var colorCarousel = document.querySelectorAll('.product-single > .mini-carousel');
    if (colorCarousel.length < 1) {
        throw('Error finding color carousel');
    }
    colorCarousel = colorCarousel[0];
    var product = document.getElementsByClassName('product-single');
    var content = product[0].getElementsByClassName('main-content-block')[0];
    var carouselCells = colorCarousel.getElementsByClassName('carousel-cell');
    var flexContainer = document.createElement('ul');
    flexContainer.id = 'product-color-container';
    flexContainer.classList.add('dismantled-carousel');
    content.appendChild(flexContainer);
    var cellCount = carouselCells.length + 0;
    for (var i = 0; i < cellCount; i++) {
        i = i + (carouselCells.length - cellCount);
        var colorItem = document.createElement('li');
        colorItem.classList.add('product-color-cell');
        colorItem.appendChild(carouselCells.item(i).cloneNode(true));
        flexContainer.appendChild(colorItem);
    }
    colorCarousel.remove();
}

// get stock color with name of
function add_colors_to_stocktable() {
    console.log('add_colors_to_stocktable')
    var stockTable = document.querySelectorAll('.main-content-block .AddToCartForm > table');
    if (stockTable.length < 1) {
        throw('Error finding stock table');
    }
    stockTable = stockTable[0];
    var allHeaders = stockTable.querySelectorAll('th');
    var colorCells = document.querySelectorAll('#product-color-container > .product-color-cell > .carousel-cell');
    for (var i = 0; i < allHeaders.length; i++) {
        var th = allHeaders[i];
        var colorText = allHeaders[i].querySelector('span').textContent.trim().toLowerCase();
        var m = colorCells.item(i);
        var img;
        if (m.querySelector('.product-name').textContent.trim().toLowerCase() == colorText) {
            img = m.querySelector('img');
        } else {
            for (var j = 0; j < colorCells.length; j++) {
                if (
                    j != i &&
                    colorCells[j].querySelector('.product-name').textContent.trim().toLowerCase() == colorText
                ) {
                    img = colorCells[j].querySelector('img');
                    break;
                }
            }
        }
        th.classList.add('color-name-header');
        th.prepend(img.cloneNode(true));
    }

}

// remake a node. used to strip events
function recreate_node(el, withChildren) {
    if (withChildren) {
      el.parentNode.replaceChild(el.cloneNode(true), el);
    }
    else {
      var newEl = el.cloneNode(false);
      while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
      el.parentNode.replaceChild(newEl, el);
    }
  }

function close_search() {
    document.getElementsByClassName('close-search')[0].click();
}

function go_home() {
    window.location = '/';   
}

function make_logo_home() {
    document.getElementsByClassName('js-drawer-open-left')[0]
        .addEventListener('click', go_home);
}

// make sidenav into a top nav
function open_side_nav() {
    var navButton = document.getElementsByClassName('js-drawer-open-left')[0];
    recreate_node(navButton, true);
    make_logo_home();
    var navDrawer = document.getElementById('NavDrawer');
    navDrawer.style.minWidth = '0px';
    navDrawer.style.width = '0px';
    navDrawer.style.display  = 'block';
    navDrawer.style.left  = '0';
    var navContainer = document.getElementById('NavContainer');
    var horizontalMenu = document.createElement('ul');
    horizontalMenu.id = 'od-nav-menu';
    var menuItems = navContainer.getElementsByClassName('mobile-nav__item')
    for (var i = 0; i < menuItems.length; i++) {
        horizontalMenu.appendChild(menuItems.item(i).cloneNode(true));
    }
    navDrawer.insertBefore(horizontalMenu, document.getElementById('SearchContainer'));
    navContainer.remove();
    if (window.location.href.indexOf("collections") > -1
        && window.location.href.indexOf("products") < 0) {
        try {
            document.getElementsByClassName('fixed-header')[0].style.paddingTop = '0px';
        } catch (error) {
            console.log(error);
        }
    } else {
        document.getElementById('PageContainer').style.marginTop = '130px';
    }
    var logo = document.getElementsByClassName('site-header__logo')[0];
    logo.style.display = 'none';
    logo.style.height = '0px';
}

function main() {
    chrome.storage.sync.get({
        odMainContentWidth: '1000',
        odFeatureImgHeight: '900',
        odHorizNavMenu: true,
        odProductStocks: true,
        odDismantleColorCarousel: true
    }, function(items) {
        document.body.style.maxWidth = items.odMainContentWidth + 'px';
        if (items.odHorizNavMenu === true) {
            open_side_nav();
        }
        if (window.location.href.indexOf("products") > -1) {
            try {
                adjust_feature_img();
                document.getElementById('od-feature-img').children[0].style.maxHeight = items.odFeatureImgHeight + 'px';
            } catch (error) {
                console.log(error);
            }
            
            if (window.location.href.indexOf("wtf") < 0 && window.location.href.indexOf("pairings") < 0) {
                try { move_size_chart(); } catch (error) { console.log(error); }
                if (items.odDismantleColorCarousel === true) {
                    try {
                        dismantle_color_carousel();
                        add_colors_to_stocktable();
                    } catch (error) { console.log(error); }
                }
            }
            if (items.odProductStocks === true && window.location.href.indexOf("pairings") < 0) {
                try { show_stock_counts(); } catch (error) { console.log(error); }
            }
        }
    });
    document.getElementById('SearchContainer').addEventListener('click', close_search);
}

main();
