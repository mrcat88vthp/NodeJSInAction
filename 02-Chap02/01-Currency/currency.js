const canadianDollar = 0.91;

function roundTwoDecimals(amount){
    return Math.round(amount * 100)/100;
}

export function canadianToUS (canadian) {
    return roundTwoDecimals(canadian * canadianDollar);
}

export function USToCanadian (us){
    return roundTwoDecimals(us/canadianDollar);
}

