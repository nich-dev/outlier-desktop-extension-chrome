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

function main() {
    // run product functions
    if (window.location.href.indexOf("products") > -1) {
        // do advertised functions
        try {
            adjust_feature_img();
        } catch (error) {
            console.log(error);
        }
        try {
            move_size_chart();
        } catch (error) {
            console.log(error);
        }

        // adjust page for options
        chrome.storage.sync.get({
            odMainContentWidth: '1000',
            odFeatureImgHeight: '900',
            odProductStocks: true
        }, function(items) {
            if (items.odProductStocks === true) {
                try {
                    show_stock_counts();
                } catch (error) {
                    console.log(error);
                }
            }
            document.body.style.maxWidth = items.odMainContentWidth + 'px';
            document.getElementById('od-feature-img').children[0].style.maxHeight = items.odFeatureImgHeight + 'px';
        });
    }
}

main();
