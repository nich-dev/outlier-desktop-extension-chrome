// Saves options to chrome.storage
function save_options() {
  var productStocks = document.getElementById('product-stocks').checked;
  var horizMenu = document.getElementById('horiz-menu').checked;
  var odDismantleColorCarousel = document.getElementById('dismantle-color-carousel').checked;
  var sizeCopmarison = document.getElementById('size-comparison').checked;
  var contentWidth =  document.getElementById('main-content-width').value;
  var featureHeight =  document.getElementById('feature-img-height').value;
  chrome.storage.sync.set({
    odMainContentWidth: contentWidth,
    odFeatureImgHeight: featureHeight,
    odProductStocks: productStocks,
    odHorizNavMenu: horizMenu,
    odDismantleColorCarousel: odDismantleColorCarousel,
    odSizeCopmarison: sizeCopmarison
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    odMainContentWidth: '1000',
    odFeatureImgHeight: '900',
    odProductStocks: true,
    odHorizNavMenu: true,
    odDismantleColorCarousel: true,
    odSizeCopmarison: true
  }, function(items) {
    document.getElementById('product-stocks').checked = items.odProductStocks;
    document.getElementById('horiz-menu').checked = items.odHorizNavMenu;
    document.getElementById('dismantle-color-carousel').checked = items.odDismantleColorCarousel;
    document.getElementById('size-comparison').checked = items.odSizeCopmarison;
    document.getElementById('main-content-width').value = items.odMainContentWidth;
    document.getElementById('feature-img-height').value = items.odFeatureImgHeight;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('btn-options-save').addEventListener('click',
    save_options);