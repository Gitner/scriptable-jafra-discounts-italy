// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: euro-sign;
// This script shows discounted products from Jafra Italia, the script can be used in the app.
const table = new UITable()
// Spit the job by page to render faster the table presentation
let isTheEnd = stepByStep()
// Completion signal to Scriptable when the script has finished running.
Script.complete()

function createTable(items) {
  for (let item of items) {
    let row = new UITableRow()
    let imageCell = row.addImageAtURL(item.url)
    let titleCell = row.addText(item.titolo, item.conti)
    imageCell.widthWeight = 20
    titleCell.widthWeight = 80
    titleCell.subtitleColor = Color.gray()
    row.height = 100
    row.cellSpacing = 10
    row.onSelect = (idx) => {
      let item = items[idx % 12]
      Safari.open(item.url)
    }
    row.dismissOnSelect = false
    table.addRow(row)
  }
}

function upperCaser(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function decode(str) {
  return str.replace(/^.*[\\\/]|\.jpg/g, '').replace(/-/g, ' ')
}

function pricer(price) {
  price = parseFloat(price.replace(',','.')) * 0.7
  return price.toFixed(2).replace('.', ',') + ' €'
}

function scounter(intero, sconto) {
  let discPercent = 100 * (parseFloat(sconto.replace(',','.')) / parseFloat(intero.replace(',','.')) - 1)
  return Math.round(discPercent).toString() + '%'
}

function createItems(matches) {
  let items = []
  let price, dscnt
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].endsWith('jpg')) {
      price = matches[i + 1].replace(/price">/, '')
      dscnt = matches[i + 2].replace(/discount">/, '')
      items.push({
        url: matches[i].replace(/data-full-size-image-url="/, ''),
        titolo: upperCaser(decode(matches[i])),
        conti: pricer(dscnt) + ' (' + pricer(price) + ') ' + scounter(price, dscnt)
      })
    }
  }
  return items
}

async function loadHtml(page = 1) {
  const url = 'https://www.starline-italia.com/119-offerte/?page=' + page
  const req = new Request(url)
  const html = await req.loadString()
  return html
}

function numPages(dividend, divisor) {
  return Math.ceil(parseInt(dividend) / parseInt(divisor))
}

// Present the full list of Jafra discounted products.
async function stepByStep() {
  let matches = []
  let html = await loadHtml()
  const numProducts = html.match(/[0-9]{1,3}\sproduct\(s\)/)
  const max = numPages(numProducts[0], '12')
  table.present(true)
  for (let i = 1; i <= max; i++) {
    html = (i === 1 ? html : await loadHtml(i))
    matches = html.match(/data-full-size-image-url="https[^"]*?.jpg|price">[0-9]{1,3},[0-9]{2}|discount">[0-9]{1,3},[0-9]{2}/g)
    createTable(createItems(matches))
    table.reload()
  }
  return true
}