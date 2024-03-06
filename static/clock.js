const numNodeLists = document.querySelectorAll('.nums')

setInterval(setClock, 1000)

function setClock () {
  const time = new Date()
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const twoDigitify = num => ('0' + num).slice(-2)
  const timeArr = [...twoDigitify(hours).split(''), ...twoDigitify(minutes).split(''), ...twoDigitify(seconds).split('')]

  numNodeLists.forEach((numNodeList, index) => {
    numNodeList.querySelectorAll('li').forEach(numNodeListItem => {
      /* global anime */
      anime({
        targets: numNodeListItem,
        top: (-44) * timeArr[index],
        easing: 'easeOutQuint'
      })
    })
  })
}
