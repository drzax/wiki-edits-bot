# wiki-edits-bot

Collects and toots about edits to the English language Wikipedia from IP addresses associated with Australian government organisations.

It posts to https://aus.social/@WikiEdits

## IP Address data

IP address ranges to check for edits are collected in two steps:

1. A manual scan through the data at https://ipinfo.io/countries/au to collect [ASNs of Australian government organisations](data/asns.js)
2. The collected ASNs are used to fetch [IP address ranges](data/asns/) from the bgpview.io API.

If you think there are missing ASNs or any have been included erroniously, please [raise a ticket](https://github.com/drzax/wiki-edits-bot/issues/new).

Right now it only posts about federal government organisations, but that might change.

## Wikipedia data

A [usercontribs](https://www.mediawiki.org/w/api.php?action=help&modules=query%2Busercontribs) query is run for all collected IP address ranges on the Wikipedia API.

## Running it

This thing runs thanks to GitHub workflows in a [technique](https://simonwillison.net/series/git-scraping/) inspired by Simon Willison.
