if (window.location.href.indexOf("products") > -1) {
    var product = document.getElementsByClassName('product-single');
    var content = product[0].getElementsByClassName('main-content-block')[0];
    var clonedImg = product[0].getElementsByClassName('feature-image')[0].cloneNode(true);
    clonedImg.classList.remove("feature-image");
    content.prepend(clonedImg);
    content.appendChild(document.getElementsByClassName('sizechart')[0].cloneNode(true));
    
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
