class PurchasePack {
    agSku;

    currency = "USD";
    rawPrice;
    basePriceCents;
    usdRawPrice;
    usdPriceCents;
    priceCents;
    formattedPrice;

    tickets;

    description;

    constructor(priceCents, tickets, description, agSku) {
        this.basePriceCents = priceCents;
        this.usdPriceCents = priceCents;
        this.priceCents = priceCents;
        this.rawPrice = (priceCents / 100).toFixed(2);
        this.usdRawPrice = (priceCents / 100).toFixed(2);
        this.formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(priceCents / 100);

        this.tickets = tickets;
        this.description = description;
        this.agSku = agSku;
    }

    setLocalizedPrice(localizationResult) {
        this.rawPrice = localizationResult.localized.amount;
        this.priceCents = localizationResult.localized.amount * 100;
        this.usdRawPrice = localizationResult.localizedUsd.amount;
        this.usdPriceCents = localizationResult.localizedUsd.amount * 100;
        this.currency = localizationResult.localized.currency;
        this.formattedPrice = localizationResult.localized._formatted;
    }
}

var purchasePacks = [
    {},
    new PurchasePack(100, 10, _("Pack of {0} tickets", "10"), "m-10_tickets:1"),
    new PurchasePack(500, 55, _("Pack of {0} tickets", "55"), "m-55_tickets:1"),
    new PurchasePack(1000, 120, _("Pack of {0} tickets", "120"), "m-120_tickets:1"),
    new PurchasePack(2000, 250, _("Pack of {0} tickets", "250"), "m-250_tickets:1"),
    new PurchasePack(5000, 650, _("Pack of {0} tickets", "650"), "m-650_tickets:1"),
    new PurchasePack(10000, 1400, _("Pack of {0} tickets", "1400"), "m-1400_tickets:1")
];