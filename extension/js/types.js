function SacrificesMade(letters, words) {
	this.letters = letters;
	this.words = words;
	this.won = false;
}


function textlist(vals) {
	vals = vals.map(x=>`"${x}"`);
	if (vals.length === 0) {
		return 'None';
	}
	if (vals.length === 1) {
		return vals[0];
	}
	if (vals.length === 2) {
		return `${vals[0]} and ${vals[1]}`
	}
	return `${vals.slice(0, -1).join(', ')}, and ${vals[vals.length - 1]}`
}