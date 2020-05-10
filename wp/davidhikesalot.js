/* Global Containers (in lieus of multi-file classes) */
const Hikes = {} // Hikes[hikeStatus] = [hikes]
const OverallStats = {
  completed: {parks: 0, hikes: 0, distance: 0.0, elevation: 0.0},
  planned: {hikes: 0, distance: 0.0, elevation: 0.0},
  inprogress: {parks: 0},
  notstarted: {parks: 0},
}
const Parks =[] // Parks[parkName] = parkSheetRow
const ParkStats = {}
const GoToParkOptions = []

/* Global Info */
const SmallMedia = window.matchMedia('only screen and (max-width: 768px)').matches
const ParksSheetUrl = 'https://spreadsheets.google.com/feeds/list/1n3-VmBC3xEZnEGdV2daK4UODY6_2fkYNBcJ4Yj9r4AE/ooywmlb/public/values?alt=json'
const HikesSheetUrl = 'https://spreadsheets.google.com/feeds/list/1n3-VmBC3xEZnEGdV2daK4UODY6_2fkYNBcJ4Yj9r4AE/o6rptkw/public/values?alt=json'

/* Utility Functions */
const cellText = (row, id) => {
  return row['gsx$'+id]['$t']
}
const cellIsEmpty = (row, id) => (['', '--'].indexOf(cellText(row, id)) >= 0)
const getHikeListByStatus = (hikeStatus, parkName) => {
  const filteredHikes = (hikeStatus, parkName) => {
    return parkName
      ? Hikes[hikeStatus].filter(row => cellText(row, 'parkname') === parkName)
      : Hikes[hikeStatus].sort(sortByParkName)
  }

  return filteredHikes(hikeStatus, parkName).reduce((hikes, hikeRow) => {
    const parkName = cellText(hikeRow, 'parkname') || ''
    hikes.push(`
      <li class="bullet-icon ${hikeIcon(hikeRow)}">
         ${parkName} ${hikeLink(hikeRow)} ${hikeStats(hikeRow)} ${hikePost(hikeRow)}
      </li>`,
    )
    return hikes
  }, [])
}
const parkInChallenge = parkRow => cellText(parkRow, 'eastbaychallenge') !== ''
const parkGetProgress = parkRow => {
  const parkStatus = cellText(parkRow, 'eastbaychallenge')
  if (!parkStatus) return
  switch (parkStatus) {
    case 'completed': return 'completed'
    case 'not-started': return 'notstarted'
    default: return 'inprogress'
  }
}
const hikeIcon = row => cellText(row, 'favorite') ? 'favorite' : 'normal'
const hikeInfo = row => {
  const parts = []
  const stats = hikeStats(row, false)
  if (stats) parts.push(stats)
  if (cellText(row, 'teaser')) parts.push(cellText(row, 'teaser'))
  return parts.join(', ')
}
const hikeLink = row => cellText(row, 'mapurl') ? `<a target="_blank" href="${cellText(row, 'mapurl')}">${cellText(row, 'hikename')}</a>` : ''
const hikePark = row => {
  const parkName = cellText(row, 'parkname')
  const parkRow = Parks[parkName]
  const parkInfo = [cellText(parkRow, 'fullname') || parkName]
  if (cellText(parkRow, 'city')) parkInfo.push(cellText(parkRow, 'city'))
  if (cellText(parkRow, 'region')) parkInfo.push(cellText(parkRow, 'region'))
  return parkInfo.join(', ')
}
const hikePost = row => cellText(row, 'blogposturl') ? `<a target="_blank" href="${cellText(row, 'blogposturl')}"><i class="far fa-images"></i></a>` : ''
const hikeStats = (row, wrap=true) => {
  if (cellText(row, 'distance') || cellText('elevation')) {
    const hikeStats = []
    hikeStats.push(cellText(row, 'distance') ? `${cellText(row, 'distance')}mi` : '')
    hikeStats.push(cellText(row, 'elevation') ? `${cellText(row, 'elevation')}ft gain` : '')
    return wrap ? `(${hikeStats.join(', ')})` : `${hikeStats.join(', ')}`
  } else {
    return ''
  }
}
const initIfUndefined = (obj, key, value) => {
  if (! (key in obj)) obj[key] = value
}
const pageHasElement = selector => jQuery(selector).length > 0
const parkHikesStr = (park, parkStatus, parkSheetRow) => {
  const totalHikes = cellText(parkSheetRow, 'hikesleft')
    ? cellText(parkSheetRow, 'hikesleft')
    : (park in ParkStats && ParkStats[park].total.hikes)
      ? ParkStats[park].total.hikes : '?'

  if (park in ParkStats) {
    return parkStatus === 'completed' ? ` (${totalHikes} hikes)` : ` (${ParkStats[park].completed.hikes}/${totalHikes})`
  } else {
    return ` (${totalHikes} left)`
  }
}
const sortByHikeDate = (rowA, rowB) => {
  const dateA = new Date(cellText(rowA, 'hikedate'))
  const dateB = new Date(cellText(rowB, 'hikedate'))
  return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0
}
const sortByParkName = (rowA, rowB) => {
  const parkA = cellText(rowA, 'parkname')
  const parkB = cellText(rowB, 'parkname')
  return (parkA < parkB) ? -1 : (parkA > parkB) ? 1 : 0
}
const updateOverallStats = (hikeStatus, distance, elevation) => {
  const statType = (hikeStatus === 'completed') ? 'completed' : 'planned'
  OverallStats[statType].hikes++
  OverallStats[statType].distance += isNaN(distance) ? 0 : distance
  OverallStats[statType].elevation += isNaN(elevation) ? 0 : elevation
}
const updateChallengeStats = parkStatus => {
  switch (parkStatus) {
    case 'no-hikes':
      return // No park details for no-hikes. Just jump them to the park website

    case 'completed':
      OverallStats.completed.parks++
      break

    case 'not-started':
      OverallStats.notstarted.parks++
      break

    default: // Will need to change when I add hikes not part of the challenge to the sheet
      OverallStats.inprogress.parks++
      break
  }
}
const updateParkStats = (park, hikeStatus, distance, elevation) => {
  if (! (park in ParkStats)) {
    ParkStats[park] = {
      total: {hikes: 0, distance: 0.0, elevation: 0.0},
      completed: {hikes: 0, distance: 0.0, elevation: 0.0},
      planned: {hikes: 0, distance: 0.0, elevation: 0.0},
    }
  }
  const statType = (hikeStatus === 'completed') ? 'completed' : 'planned'
  ParkStats[park].total.hikes++
  ParkStats[park].total.distance += isNaN(distance) ? 0 : distance
  ParkStats[park].total.elevation += isNaN(elevation) ? 0 : elevation
  ParkStats[park][statType].hikes++
  ParkStats[park][statType].distance += isNaN(distance) ? 0 : distance
  ParkStats[park][statType].elevation += isNaN(elevation) ? 0 : elevation
}

jQuery(document).ready(function($) {
  const lozadObserver = lozad()
  lozadObserver.observe()

  $.when($.getJSON(ParksSheetUrl), $.getJSON(HikesSheetUrl)).done(function(parksSheet, hikesSheet) {
    hikesSheet[0].feed.entry.forEach(function(hikesSheetRow) {
      const parkName = cellText(hikesSheetRow, 'parkname')
      const hikeName = cellText(hikesSheetRow, 'hikename')
      const hikeStatus = cellText(hikesSheetRow, 'hikestatus')
      if (!parkName || !hikeName) return // Not a hike

      initIfUndefined(Hikes, hikeStatus, [])
      Hikes[hikeStatus].push(hikesSheetRow)

      const distance = parseFloat(cellText(hikesSheetRow, 'distance'))
      const elevation = parseFloat(cellText(hikesSheetRow, 'elevation'))
      updateParkStats(parkName, hikeStatus, distance, elevation)
      updateOverallStats(hikeStatus, distance, elevation)
    })

    parksSheet[0].feed.entry.forEach(function(parkSheetRow, parkSheetIdx) {
      const parkName = cellText(parkSheetRow, 'parkname')
      if (!parkName) return // Not a park
      Parks.push(parkSheetRow)

      const parkStatus = cellText(parkSheetRow, 'eastbaychallenge')
      updateChallengeStats(parkStatus)
    })

    /**
     *  Now just check and see which divs pages are looking for and fill them in
     */

    if (pageHasElement('#hikingStats')) {
      $('#hikingStats').append(`
        Done: ${OverallStats.completed.parks} parks, 
        ${OverallStats.completed.hikes} hikes, 
        ${OverallStats.completed.distance.toFixed(1).toLocaleString()}mi, 
        ${OverallStats.completed.elevation.toLocaleString()}ft
        <br/>
        Planned: ${OverallStats.planned.hikes} hikes, 
        ${OverallStats.planned.distance.toFixed(1).toLocaleString()}mi, 
        ${OverallStats.planned.elevation.toLocaleString()}ft
      `)
    }

    if (pageHasElement('#sectionHikes')) {
      ['completed', 'planned', 'nexthike'].forEach(hikeStatus => {
        if (pageHasElement(`#sectionHikes #${hikeStatus}`) && (hikeStatus in Hikes)) {
          const hikes = getHikeListByStatus(hikeStatus)
          if (hikes.length) {
            $(`#sectionHikes #${hikeStatus} ul.hikes-list`).append(hikes.join(''))
          }
        }
      })
    }

    if (pageHasElement('#sectionChallenge')) {
      const challengeParksGroups = {
        // listDivId: progress-group
        parksCompleted: 'completed',
        parksInProgress: 'inprogress',
        parksNotStarted: 'notstarted',
      }
      Object.keys(challengeParksGroups).forEach(parkStatusDivId => {
        const thisProgress = challengeParksGroups[parkStatusDivId]
        $(`#${parkStatusDivId} h6`).append(` <span class="park-list-count">(${OverallStats[thisProgress].parks})</span>`)

        Parks.filter(row => parkInChallenge(row) && parkGetProgress(row) === thisProgress).forEach(parkSheetRow => {
          const parkName = cellText(parkSheetRow, 'parkname')
          const parkStatus = cellText(parkSheetRow, 'eastbaychallenge')
          const parkAnchorID = parkName.replace(/[^\w]/g, '-').toLowerCase()
          const parkHasHikes = (parkName in ParkStats && ParkStats[parkName].total.hikes)
          const missingHikesFlag = cellIsEmpty(parkSheetRow, 'trailshikedid')
          const missingHikesMarker = (missingHikesFlag) ? ' ...' : ''

          // Update Park Lists
          const listParkLink = (parkHasHikes)
            ? `<a href="https://davidhikesalot.com/parks/#${parkAnchorID}">${cellText(parkSheetRow, 'parkname')}</a>`
            : `<a href="${cellText(parkSheetRow, 'parkurl')}">${cellText(parkSheetRow, 'parkname')}</a>`
          const parksListLi = `
            <li class="bullet-icon ${parkStatus}">
               ${listParkLink}${parkHikesStr(parkName, parkStatus, parkSheetRow)}${missingHikesMarker}
            </li>`

          $(`#${parkStatusDivId} ul.parks-list`).append(parksListLi)
        })
      })
    }

    if (pageHasElement('#sectionHikesByDate')) {
      const entries = []
      const hikes = Hikes.completed.filter(hikeRow => {
        return !cellIsEmpty(hikeRow, 'hikedate') &&
          moment(cellText(hikeRow, 'hikedate')).isValid()
      }).sort(sortByHikeDate).reverse()
      hikes.forEach(hikeRow => {
        const hikeInfo = {
          park: cellText(hikeRow, 'parkname'),
          name: cellText(hikeRow, 'hikename'),
          date: moment(cellText(hikeRow, 'hikedate')),
        }
        const entry = `
          <div class="page-subsection hike-card">
            <div class="hike-card-date">
              <time datetime="${hikeInfo.date.format('L')}" class="icon">
                <div class='time-header'>${hikeInfo.date.format('MMM')} ${hikeInfo.date.format('YYYY')}</div>
                <div class='time-page'>
                  <div class='time-page-row'>${hikeInfo.date.format('DD')}</div>
                </div>
                <div class='time-footer'>${hikeInfo.date.format('dddd')}</div>
              </time>
            </div>
            <div class="hike-card-content">
              <p>
              ${hikeLink(hikeRow)}<br/>
              ${hikePark(hikeRow)}<br/>
              ${hikeInfo(hikeRow)}, ${hikePost(hikeRow)}
              </p>
            </div>
          </div>`
        entries.push(entry)
      })
      if (entries.length) {
        $('#sectionHikesByDate').append(entries.join(''))
      }
    }

    if (pageHasElement('#sectionParkDetails')) {
      const parks = Parks.filter(parkRow => {
        const parkName = cellText(parkRow, 'parkname')
        return (parkName in ParkStats && ParkStats[parkName].total.hikes > 0)
      })
      parks.sort(sortByParkName).forEach((parkSheetRow, parkSheetIdx) => {
        const parkName = cellText(parkSheetRow, 'parkname')
        const parkAnchorID = parkName.replace(/[^\w]/g, '-').toLowerCase()
        const parkAnchor = `<a name="${parkAnchorID}" class="park-anchor"></a>`
        const parkCity = cellText(parkSheetRow, 'primarycity') ? ` - ${cellText(parkSheetRow, 'primarycity')}` : ''
        const parkStatusIcon = `<span class="status-icon ${cellText(parkSheetRow, 'eastbaychallenge')}"></span>`
        const parkHeader = `${parkStatusIcon} ${parkName}${parkCity}`
        const missingHikesFlag = cellIsEmpty(parkSheetRow, 'trailshikedid')
        GoToParkOptions.push({id: parkAnchorID, name: parkName})

        // Parks Hiked Map
        let map = '<img src="//placehold.it/200" alt="">'
        if (!missingHikesFlag) {
          map = `
            <a target="_blank" href="https://drive.google.com/uc?id=${cellText(parkSheetRow, 'trailshikedid')}">
              <img class="lozad"
                data-src="https://drive.google.com/uc?id=${cellText(parkSheetRow, 'trailshikedmobileid')}"
                data-srcset="https://drive.google.com/uc?id=${cellText(parkSheetRow, 'trailshikedwebid')} 768w">
            </a>
          `
        }
        let parkDiv = `${parkAnchor}<div class="page-subsection park-card ${parkAnchorID}">
          <div class="park-card-image">${map}</div>
          <div class="park-card-content">
            <h5>${parkHeader}</h5>
            <p>
        `

        // Park Quick Links
        const quickLinks = []
        const url2link = (id, text) => `<a target="_blank" href="${cellText(parkSheetRow, id)}">${text}</a> <i class="fas fa-xs fa-external-link-alt"></i>`
        const id2link = (id, text) => `<a target="_blank" href="https://drive.google.com/uc?id=${cellText(parkSheetRow, id)}">${text}</a> <i class="fas fa-xs fa-external-link-alt"></i>`
        if (! cellIsEmpty(parkSheetRow, 'parkurl')) quickLinks.push(url2link('parkurl', 'Park Website'))
        if (! cellIsEmpty(parkSheetRow, 'trailmapid')) quickLinks.push(id2link('trailmapid', 'Trail Map'))
        if (! cellIsEmpty(parkSheetRow, 'alltrailsparkurl')) quickLinks.push(url2link('alltrailsparkurl', 'All Trails Best Hikes'))
        const joiner = (SmallMedia) ? '<br/>' : ' | '
        parkDiv += `<span class="small-text">${quickLinks.join(joiner)}<span>`

        // Park Hikes
        ;['completed', 'planned', 'nexthike'].forEach(hikeStatus => {
          const hikes = getHikeListByStatus(hikeStatus, parkName)
          if (hikes.length) {
            parkDiv += `
          <div class="small-text">
            <span class="capitalize"><b>${hikeStatus}</b></span>
            <ul>${hikes.join('')}</ul>
          </div>`
          }
        })
        parkDiv += '</div></div><br>'
        $('#sectionParkDetailsCards').append(parkDiv)

        // Lozad - Lazy loading. Dynamically detect new images
        if (parkSheetIdx % 5 === 0) {
          lozadObserver.observe()
        }
      })
      // Register any added lozad images
      lozadObserver.observe()

      GoToParkOptions.sort((a, b) => a.name.localeCompare(b.name))
      const parkSelectOptions = GoToParkOptions.reduce((list, park) => {
        list += `<option value="${park.id}">${park.name}</option>`
        return list
      }, '')
      $('select#goToPark').append(parkSelectOptions)

      $('select#goToPark').change(function() {
        const sel = $(this).find('option:selected')
        window.scrollTo(0, $(`.park-card.${sel[0].value}`).offset().top - 50)
      })

      if (location.hash) {
        // If someone comes with an anchor, go there (after the images have loaded)
        setTimeout(function() {
          location.href = location.hash
        }, 2000)
      }
    }
  })
})
