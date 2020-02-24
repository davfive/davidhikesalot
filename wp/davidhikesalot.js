const smallMedia = window.matchMedia("only screen and (max-width: 768px)").matches
const parksSheetUrl = "https://spreadsheets.google.com/feeds/list/1n3-VmBC3xEZnEGdV2daK4UODY6_2fkYNBcJ4Yj9r4AE/ooywmlb/public/values?alt=json"
const hikesSheetUrl = "https://spreadsheets.google.com/feeds/list/1n3-VmBC3xEZnEGdV2daK4UODY6_2fkYNBcJ4Yj9r4AE/o6rptkw/public/values?alt=json"
const cellText = (row, id) => { return row["gsx$"+id]["$t"]; }
const cellIsEmpty = (row,id) => (["","--"].indexOf(cellText(row,id)) >= 0)
const hikeStatuses = ["nexthike", "planned", "completed"]
const parkAnchor = (name) => name.replace(/[^\w]/g,'-').toLowerCase()
const goToParkOptions = []

function goToPark() {

}

jQuery(document).ready(function($) {
  $.when($.getJSON(parksSheetUrl), $.getJSON(hikesSheetUrl)).done(function(parksSheet, hikesSheet) {
    const Hikes = {}
    const Stats = {
      completed: { parks: 0, hikes: 0, distance: 0.0, elevation: 0.0 },
      planned:   { hikes: 0, distance: 0.0, elevation: 0.0 },
    }
    hikesSheet[0].feed.entry.forEach(function(hikesSheetRow) {
       const parkName   = cellText(hikesSheetRow, "parkname")
       const hikeName   = cellText(hikesSheetRow, "hikename")
       if (!parkName || !hikeName) return // Not a hike       

       const hikeStatus = cellText(hikesSheetRow, "hikestatus")
       if (! (parkName in Hikes)) { 
         Hikes[parkName] = { }
       }
       if (! (hikeStatus in Hikes[parkName])) Hikes[parkName][hikeStatus] = []
       
       Hikes[parkName][hikeStatus].push(hikesSheetRow)

       const distance  = parseFloat(cellText(hikesSheetRow, "distance"))
       const elevation = parseFloat(cellText(hikesSheetRow, "elevation")) 

       const statType = (hikeStatus === "completed") ? "completed" : "planned"
       Stats[statType].hikes++
       Stats[statType].distance  += isNaN(distance) ? 0 : distance 
       Stats[statType].elevation += isNaN(elevation) ? 0 : elevation
    })
    parksSheet[0].feed.entry.forEach(function(parkSheetRow) {
      const parkName = cellText(parkSheetRow,"parkname")

      /** PARKS LIST */

      // Gather Park info
      const missingHikesFlag = cellIsEmpty(parkSheetRow, "trailshikedid")
      const parkAnchorID=cellText(parkSheetRow,'parkname').replace(/[^\w]/g,'-').toLowerCase()
      const missingHikesMarker = (missingHikesFlag) ? ' ...' : ""
      const hikesLeft = (cellText(parkSheetRow,'hikesleft')) ? ` - ${cellText(parkSheetRow,'hikesleft')} left` : ''

      // Update Park Lists
      const parksListLi = `
        <li class="bullet-icon ${cellText(parkSheetRow,'completionstatus')}">
           <a href="#${parkAnchorID}">${cellText(parkSheetRow,'parkname')}</a>${hikesLeft}${missingHikesMarker}
        </li>`
      switch (cellText(parkSheetRow,'completionstatus')) {
        case 'no-hikes':
          const li = `
            <li class="bullet-icon ${cellText(parkSheetRow,'completionstatus')}">
              <a href="${cellText(parkSheetRow,'parkurl')}">${cellText(parkSheetRow,'parkname')}</a> <i class="fas fa-xs fa-external-link-alt"></i>
            </li>`
          $("#parksNoHikes ul").append(li)
          return // No park details for no-hikes. Just jump them to the park website

        case 'completed':
          Stats.completed.parks++
          $("#parksCompleted ul.parks-list").append(parksListLi)
          break

        case 'not-started':
          $("#parksNotStarted ul.parks-list").append(parksListLi)
          break

        default:
          $("#parksInProgress ul.parks-list").append(parksListLi)
          break
      }

      /** HIKES LIST */

      // Hikes categorized by text in "The Hikes" Sheet, "Completion Status" Column
      const hikes = { planned: [], nexthike: [], completed: [] }
      if (parkName in Hikes) {
        const hikeLink = (row) => cellText(row, "mapurl") ? `<a target="_blank" href="${cellText(row, "mapurl")}">${cellText(row, "hikename")}</a>` : ""
        const hikePost = (row) => cellText(row, "blogposturl") ? `<a target="_blank" href="${cellText(row, "blogposturl")}"><i class="far fa-images"></i></a>` : ""
        const hikeIcon = (row) => cellText(row, "favorite") ? "favorite" : "normal"
        const hikeStats = (row) => {
          if (cellText(row, "distance") || cellText("elevation")) {
            let hikeStats = []
            hikeStats.push(cellText(row, "distance") ? `${cellText(row, "distance")}mi` : "")
            hikeStats.push(cellText(row, "elevation") ? `${cellText(row, "elevation")}ft gain` : "")
            return `(${hikeStats.join(", ")})`
          } else {
            return ""
          }
        }

        Object.keys(Hikes[parkName]).forEach(hikeType => {
          Hikes[parkName][hikeType].forEach(hikeRow => {
            
            hikes[hikeType].push(`<li class="bullet-icon ${hikeIcon(hikeRow)}">${parkName} ${hikeLink(hikeRow)} ${hikeStats(hikeRow)} ${hikePost(hikeRow)}</li>`)
          })
          if (hikes[hikeType].length) {
            $(`#sectionHikes #${hikeType} ul.hikes-list`).append(hikes[hikeType].join(""))
          }
        })
      }

      /** PARKS DETAIL */
      
      // Park Header
      const parkAnchor = `<a name="${parkAnchorID}"></a>`
      const parkCity   = cellText(parkSheetRow,"primarycity") ? ` - ${cellText(parkSheetRow,'primarycity')}` : ""
      const parkStatus = ` (${cellText(parkSheetRow,'completionstatus')})`
      const parkStatusIcon = `<span class="status-icon ${cellText(parkSheetRow,'completionstatus')}"></span>`
      const parkHeader = `${parkStatusIcon} ${parkName}${parkCity}${parkStatus}${hikesLeft}`
      goToParkOptions.push({id: parkAnchor, name: parkName})

      // Parks Hiked Map
      let map = '<img src="//placehold.it/200" alt="">'
      if (!smallMedia && !missingHikesFlag) {
        map = `
          <a target="_blank" href="https://drive.google.com/uc?id=${cellText(parkSheetRow,'trailshikedid')}">
          <img src="https://drive.google.com/uc?id=${cellText(parkSheetRow,'trailshikedid')}"></a>
          `
      }
      let parkDiv = `${parkAnchor}<div class="page-subsection park-card">
        <div class="park-card-image">${map}</div>
        <div class="park-card-content">
          <h5>${parkHeader}</h5>
          <p>
      `

      // Park Quick Links
      const quickLinks = []
      const url2link = (id, text) => `<a target="_blank" href="${cellText(parkSheetRow, id)}">${text}</a> <i class="fas fa-xs fa-external-link-alt"></i>`
      const id2link  = (id, text) => `<a target="_blank" href="https://drive.google.com/uc?id=${cellText(parkSheetRow, id)}">${text}</a> <i class="fas fa-xs fa-external-link-alt"></i>`
      if (! cellIsEmpty(parkSheetRow,'parkurl'))          quickLinks.push(url2link('parkurl', 'Park Website'))
      if (! cellIsEmpty(parkSheetRow,'trailmapid'))       quickLinks.push(id2link('trailmapid', 'Trail Map'))
      if (! cellIsEmpty(parkSheetRow,'alltrailsparkurl')) quickLinks.push(url2link('alltrailsparkurl', 'All Trails Best Hikes'))
      if (smallMedia && !missingHikesFlag)                quickLinks.push(id2link('trailshikedid', 'David\'s Hike Progress'))
      const joiner = (smallMedia) ? '<br/>' : ' | '
      parkDiv += `<span class="small-text">${quickLinks.join(joiner)}<span>`

      // Park Hikes
      hikeStatuses.forEach(hikeStatus => {
        if (hikes[hikeStatus].length) {
          parkDiv += `
            <div class="small-text">
              <span class="capitalize"><b>${hikeStatus}</b></span>
              <ul>${hikes[hikeStatus].join("")}</ul>
            </div>`
        }
      })
      parkDiv += '</div></div><br>'
      $("#sectionParkDetailsCards").append(parkDiv)
    })

    goToParkOptions.sort((a,b) => a.name.localCompare(b.name))
    parkSelectOptions = goToParkOptions.reduce((list, parkInfo) => {
      list += `<option value="${parkInfo.anchor}">${parkName}</option>`
    },'')
    $("select#goToPark").append(parkSelectOptions)

    $("#hikingStats").append(`
       Done: ${Stats.completed.parks} parks, ${Stats.completed.hikes} hikes, ${Stats.completed.distance.toFixed(1).toLocaleString()}mi, ${Stats.completed.elevation.toLocaleString()}ft
       <br/>
       Planned: ${Stats.planned.hikes} hikes, ${Stats.planned.distance.toFixed(1).toLocaleString()}mi, ${Stats.planned.elevation.toLocaleString()}ft
    `)
  })
})
