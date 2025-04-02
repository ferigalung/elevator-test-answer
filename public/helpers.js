function getDaysInMonth(month,year) {     
    if( typeof year == "undefined") year = 1999; // any non-leap-year works as default     
    let currmon = new Date(year,month),     
        nextmon = new Date(year,month+1);
    return Math.floor((nextmon.getTime()-currmon.getTime())/(24*3600*1000));
} 
function getDateTimeSince(target) { // target should be a Date object
    let now = new Date(), yd, md, dd, hd, nd, sd, out = [];
    yd = target.getFullYear()-now.getFullYear();
    md = target.getMonth()-now.getMonth();
    dd = target.getDate()-now.getDate();
    hd = target.getHours()-now.getHours();
    nd = target.getMinutes()-now.getMinutes();
    sd = target.getSeconds()-now.getSeconds();
    if( md < 0) {yd--; md += 12;}
    if( dd < 0) {
        md--;
        dd += getDaysInMonth(now.getMonth()-1,now.getFullYear());
    }
    if( hd < 0) {dd--; hd += 24;}
    if( md < 0) {hd--; md += 60;}
    if( sd < 0) {md--; sd += 60;}

    if( yd > 0) out.push( yd+" year"+(yd == 1 ? "" : "s"));
    if( md > 0) out.push( md+" month"+(md == 1 ? "" : "s"));
    if( dd > 0) out.push( dd+" day"+(dd == 1 ? "" : "s"));
    if( hd > 0) out.push( hd+" hour"+(hd == 1 ? "" : "s"));
    if( nd > 0) out.push( nd+" minute"+(nd == 1 ? "" : "s"));
    if( sd > 0) out.push( sd+" second"+(sd == 1 ? "" : "s"));
    return out.join(" ");
}