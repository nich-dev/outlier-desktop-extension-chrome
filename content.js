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

class SizeChart {
    COMP_KEY = 'odComparisons'
    SVG_COMP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="20" viewBox="0 0 24 24"><path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>'
    COMP_TIP = '<span class="tooltiptext">Add to size comparisons</span>'

    // move size chart up to under the size selection
    copy_below_stock() {
        var product = document.getElementsByClassName('product-single');
        var content = product[0].getElementsByClassName('main-content-block')[0];
        content.appendChild(document.getElementsByClassName('sizechart')[0].cloneNode(true));
    }
    
    // add comp buttons to size chart
    add_comparison_buttons() {
        var sizeHeaders = document.querySelectorAll('.sizechart:first-of-type > tbody > tr > th + th');
        for (let i = 0; i < sizeHeaders.length; i++) {
            sizeHeaders[i].classList.add('clickable');
            sizeHeaders[i].classList.add('tooltip');
            sizeHeaders[i].insertAdjacentHTML('beforeend', this.SVG_COMP_ICON);
            sizeHeaders[i].insertAdjacentHTML('beforeend', this.COMP_TIP);
            sizeHeaders[i].addEventListener('click', (ev) => this.compare_click(ev));
        }
    }

    // handler for the add comparison click event
    compare_click(event) {
        var headerElement = event.target;
        if (headerElement.classList.contains('tooltip') === false) {
            headerElement = headerElement.closest('.tooltip');
        }
        var sizeText = headerElement.innerText.split('\n')[0];
        var measurements = this.get_measurements(sizeText);
        var productName = document.querySelector('.main-content-block > h1').innerText;
        this.save_comparison(productName, sizeText, measurements);
    }

    // returns list of all name, value measurements in the first size table
    get_measurements(size) {
        var measurements = [];
        var sizeHeaders = document.querySelectorAll('.sizechart:first-of-type > tbody > tr > th + th');
        var position = 0;
        for (let i = 0; i < sizeHeaders.length; i++) {
            var headerText = sizeHeaders[i].innerText.split('\n')[0].trim().toLowerCase();
            if (headerText === size.trim().toLowerCase()) {
                position = i + 2;
                break;
            }
        }
        var firstSizeChart = document.querySelector('.sizechart:first-of-type');
        var measurementRows = firstSizeChart.querySelectorAll('tbody > tr + tr');
        for (let i = 0; i < measurementRows.length; i++) {
            var measurmentName = measurementRows[i].querySelector('td:first-of-type').innerText;
            var measurmentValue = measurementRows[i].querySelector('td:nth-of-type(' + position + ')').innerText;
            measurements.push({ name: measurmentName, value: measurmentValue });
        }
        return measurements;
    }
    
    // saves a size to compare in local storage
    save_comparison(name, size, measurements) {
        var id = name.replaceAll(' ', '_').toLowerCase() + '_' + size.toLowerCase();
        var storageKey = this.COMP_KEY;
        chrome.storage.local.get([storageKey], function(comps) {
            var storedMeasurements = comps[storageKey];
            if (!storedMeasurements) { storedMeasurements = {}; }
            else { storedMeasurements = JSON.parse(storedMeasurements) }
            storedMeasurements[id] = { id: id, name: name, size: size, measurements: measurements };
            storedMeasurements = JSON.stringify(storedMeasurements);
            chrome.storage.local.set({ odComparisons: storedMeasurements }, function() {
                console.log('Comparisons updated');
            });
        });
    }
}
class ProductStock {
    // grab bisVariants from the html 
    // hack some regex
    // show in the UI
    show_stock_counts(){
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

    // get stock color with name of
    add_colors_to_stocktable() {
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
}

class ProductPage {
    sizeChart = new SizeChart();
    stock = new ProductStock();

    // add feature image as a background
    // shrink the feature image to content width by removing class
    adjust_feature_img(height) {
        var product = document.getElementsByClassName('product-single');
        var content = product[0].getElementsByClassName('main-content-block')[0];
        var clonedImg = product[0].getElementsByClassName('feature-image')[0].cloneNode(true);
        clonedImg.classList.remove("feature-image");
        clonedImg.id = "od-feature-img";
        content.prepend(clonedImg);
        document.getElementById('od-feature-img').children[0].style.maxHeight = height + 'px';
    }

    // strip color carousel feature
    dismantle_color_carousel() {
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
}

class NavigationBar {
    close_search() {
        document.getElementsByClassName('close-search')[0].click();
    }

    go_home() {
        window.location = '/';   
    }

    make_logo_home() {
        document.getElementsByClassName('js-drawer-open-left')[0]
            .addEventListener('click', this.go_home);
    }

    // make sidenav into a top nav
    open_side_nav() {
        var navButton = document.getElementsByClassName('js-drawer-open-left')[0];
        recreate_node(navButton, true);
        this.make_logo_home();
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
}

class ComparisonFragment {
    container; // holder for comparison table
    containerId = 'ComparisonFragment';

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'containerId';
        document.body.append(container);
    }
}

function main() {
    var navigation = new NavigationBar();

    chrome.storage.sync.get({
        odMainContentWidth: '1000',
        odFeatureImgHeight: '900',
        odHorizNavMenu: true,
        odProductStocks: true,
        odDismantleColorCarousel: true
    }, function(items) {
        document.body.style.maxWidth = items.odMainContentWidth + 'px';
        if (items.odHorizNavMenu === true) {
            navigation.open_side_nav();
        }
        if (window.location.href.indexOf("products") > -1) {
            var product = new ProductPage();
            try {
                product.adjust_feature_img(items.odFeatureImgHeight);
            } catch (error) {
                console.log(error);
            }
            
            if (window.location.href.indexOf("wtf") < 0 && window.location.href.indexOf("pairings") < 0) {
                try { product.sizeChart.copy_below_stock(); } catch (error) { console.log(error); }
                try { product.sizeChart.add_comparison_buttons(); } catch (error) { console.log(error); }
                if (items.odDismantleColorCarousel === true) {
                    try {
                        product.dismantle_color_carousel();
                        product.stock.add_colors_to_stocktable();
                    } catch (error) { console.log(error); }
                }
            }
            if (items.odProductStocks === true && window.location.href.indexOf("pairings") < 0) {
                try { product.stock.show_stock_counts(); } catch (error) { console.log(error); }
            }
        }
    });
    try {
        // There was a bug where this would hang and not load the page.
        document.getElementById('SearchContainer').addEventListener('click', navigation.close_search);
    } catch (error) { console.log(error); }
    
}

main();
