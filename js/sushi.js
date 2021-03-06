// models / data
//ODBIERA DANE JSON Z PLIKU menu.json
var items = new kendo.data.DataSource({
    schema: 
    { 
        model: {} 
    },
    transport: 
    { 
        read: 
        { 
            url:  "/data/menu.json", 
            dataType: "json" 
        } 
    }
});


// KOSZYK
// 6 FUNKCJI:
//  - contentsCount     : ZWRACA LICZBĘ PRODUKTÓW W KOSZYKU PRZECHOWYWANĄ W TABLICY contents
//  - add               : DODAJE LICZBĘ DO PRODUKTU
//  - remove            : USUWA PRODUKT Z KOSZA
//  - empty             : CZYŚCI KOSZYK
//  - clear             : TO SAMO CO WYŻEJ + this.set("cleared", true);
//  - total             : SUMA ZAPŁATY
var cart = kendo.observable({
    contents: [],
    cleared: false,

    contentsCount: function() {
        return this.get("contents").length;
    },
    <!--[DEGUG]-3] TU MNIE WYSYŁA FUNKCJA ZMIENNEJ indexModel TEGO SKRYPTU-->
    add: function(item) {
        var found = false;
        //$this->set ODWOŁANIE SIĘ DO METODY PRYWATNEJ TEGO OBIEKTU
        this.set("cleared", false);
        //SPRAWDZA CZY PRODUKT JUŻ JEST W KOSZYKU
        for (var i = 0; i < this.contents.length; i ++) {
            var current = this.contents[i];
            if (current.item === item) {
                current.set("quantity", current.get("quantity") + 1);
                found = true;
                break;
            }
        }
        //JEŚLI PRODUKTU NIE MA JESZCZE W KOSZYKU
        if (!found) {
            this.contents.push({ item: item, quantity: 1 });
        }
    },

    remove: function(item) {
        for (var i = 0; i < this.contents.length; i ++) {
            var current = this.contents[i];
            if (current === item) {
                this.contents.splice(i, 1);
                break;
            }
        }
    },

    empty: function() {
        var contents = this.get("contents");
        contents.splice(0, contents.length);
    },

    clear: function() {
        var contents = this.get("contents");
        contents.splice(0, contents.length);
        this.set("cleared", true);
    },

    total: function() {
        var price = 0,
            contents = this.get("contents"),
            length = contents.length,
            i = 0;

        for (; i < length; i ++) {
            price += parseInt(contents[i].item.price) * contents[i].quantity;
        }

        return kendo.format("{0:c}", price);
    }
});


// PODPINAM KOSZYK cart POD ZMIENNĄ KTÓRA PÓŻNIEJ JEST UŻYTA W kendo.Layout:
//      var layout = new kendo.Layout("layout-template", { model: layoutModel });
var layoutModel = kendo.observable({
    cart: cart
});


// PODPINAM KOSZYK cart POD OBIEKT...
//  TU SĄ PUBLICZNE METODY KORZYSTAJĄCE Z DANYCH OBIEKTU CART (PIERWSZEGO)
//  UŻYWANE NIŻEJ W LINIACH Z kendo.Layout I kendo.View:
//      var cartPreview = new kendo.Layout("cart-preview-template", { model: cartPreviewModel });
//      var checkout = new kendo.View("checkout-template", {model: cartPreviewModel });
var cartPreviewModel = kendo.observable({
    cart: cart,

    <!--[DEGUG]-4] PRZY DODAWANIU PRODUKTU, NIE WIEM KTO WYWOŁAŁ TĘ FUNKCJĘ
            - TA ZMIENNA OBIEKTU: cartPreviewModel JEST ZWIĄZANA (NA DOLE) Z
            SZABLONEM-SKRYPTEM cart-preview-template W KTÓRYM JEST KOSZYK!!
            - W TYM SZABLONIE ZEWNĘTRZNY DIV MA data-bind="attr: { class: cartContentsClass }">

    -->
    cartContentsClass: function() {
        return this.cart.contentsCount() > 0 ? "active" : "empty";
    },

    removeFromCart: function(e) {
        this.get("cart").remove(e.data);
    },

    emptyCart: function() {
        cart.empty();
    },

    itemPrice: function(cartItem) {
        return kendo.format("{0:c}", cartItem.item.price);
    },

    totalPrice: function() {
        return this.get("cart").total();
    },

    proceed: function(e) {
        this.get("cart").clear();
        sushi.navigate("/");
    }
});


// PODPINAM KOSZYK cart POD OBIEKT KTÓRY MA METODĘ PUBLICZNĄ DODAJĄCĄ DO KOSZYKA...
var indexModel = kendo.observable({
    items: items,
    cart: cart,
    <!--[DEGUG]-2] TU TRAFIAM OD RAZU PO DODANIU DO KOSZYKA Z ASORTYMENTU-->
    addToCart: function(e) {
        cart.add(e.data);
    }
});



var detailModel = kendo.observable({
    imgUrl: function() {
        return "/images/200/" + this.get("current").image
    },

    price: function() {
        return kendo.format("{0:c}", this.get("current").price);
    },

    addToCart: function(e) {
        cart.add(this.get("current"));
    },

    setCurrent: function(itemID) {
        this.set("current", items.get(itemID));
    },

    previousHref: function() {
        var id = this.get("current").id - 1;
        if (id === 0) {
           id = items.data().length - 1;
        }

        return "#/menu/" + id;
    },

    nextHref: function() {
        var id = this.get("current").id + 1;

        if (id === items.data().length) {
           id = 1;
        }

        return "#/menu/" + id;
    },

    kCal: function() {
        return kendo.toString(this.get("current").stats.energy /  4.184, "0.0000");
    }
});



// Views and layouts
// LAYOUT I VIEW SĄ W DOKUMENTACJI W DZIALE "SPA - SINGLE PAGE APPS"
// ... WIĘĆ MUSISZ TO PO SWOJEMU
var layout = new kendo.Layout("layout-template", { model: layoutModel });
var cartPreview = new kendo.Layout("cart-preview-template", { model: cartPreviewModel });
var index = new kendo.View("index-template", { model: indexModel });
var checkout = new kendo.View("checkout-template", {model: cartPreviewModel });
var detail = new kendo.View("detail-template", { model: detailModel });



var sushi = new kendo.Router({
    init: function() {
         console.log("router init")
        layout.render("#application");
    }
});



var viewingDetail = false;



// Routing
sushi.route("/", function() {
    console.log("router root route")
    viewingDetail = false;
    layout.showIn("#content", index);
    //TU WSKAZUJĘ BY POKAZAŁ SZABLON ID="cart-preview-template" WEWNĄTRZ #pre-content
    layout.showIn("#pre-content", cartPreview);
});



sushi.route("/checkout", function() {
    viewingDetail = false;
    layout.showIn("#content", checkout);
    cartPreview.hide();
});



sushi.route("/menu/:id", function(itemID) {
    layout.showIn("#pre-content", cartPreview);
    var transition = "",
        current = detailModel.get("current");

    if (viewingDetail && current) {
        transition = current.id < itemID ? "tileleft" : "tileright";
    }

    items.fetch(function(e) {
        if (detailModel.get("current")) { // existing view, start transition, then update content. This is necessary for the correct view transition clone to be created.
            layout.showIn("#content", detail, transition);
            detailModel.setCurrent(itemID);
        } else {
            // update content first
            detailModel.setCurrent(itemID);
            layout.showIn("#content", detail, transition);
        }
    });

    viewingDetail = true;
});



$(function() {
    sushi.start();
});
