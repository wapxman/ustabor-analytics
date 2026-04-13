// This file documents the fix applied to loadAppData in index.html
// The old code had: (!hdr.length&&ri<2) which grabbed first data row as header
// The fix: check cols labels first, never use numeric values as headers
