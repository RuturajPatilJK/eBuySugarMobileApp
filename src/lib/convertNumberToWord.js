export function ConvertNumberToWord(num) {
    const belowTwenty = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const words = (n) => {
        if (n === 0) return "";
        if (n < 20) return belowTwenty[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 !== 0 ? " " + belowTwenty[n%10] : "");
        if (n < 1000) return belowTwenty[Math.floor(n/100)] + " Hundred" + (n%100 !== 0 ? "  " + words(n%100) : "");
        if (n < 100000) return words(Math.floor(n/1000)) + " Thousand" + (n%1000 !== 0 ? " " + words(n%1000) : "");
        if (n < 10000000) return words(Math.floor(n/100000)) + " Lakh" + (n%100000 !== 0 ? " " + words(n%100000) : "");
        return words(Math.floor(n/10000000)) + " Crore" + (n%10000000 !== 0 ? " " + words(n%10000000) : "");
    };
    const intPart = Math.floor(num);
    const fracPart = Math.round((num - intPart) * 100);
    let result = words(intPart);
    result += fracPart > 0 ? " and " + words(fracPart) + " Paise Only" : " Only";
    return result;
}

export function formatReadableAmount(amount) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (num === null || isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
