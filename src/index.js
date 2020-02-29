import axios from 'axios'
import get from 'lodash.get'

const getId = async accName => {
  return await axios
    .get(
      `https://www.instagram.com/web/search/topsearch/?context=user&count=0&query={${accName}}`
    )
    .then(function(response) {
      // handle success
      console.log('The IG User Id is:', response.data.users[0].user.pk)
      return response.data.users[0].user.pk
    })
    .catch(function(error) {
      // handle error
      console.log(error)
    })
}

const getAllPosts = async (id, lastPost = '') => {
  return await axios
    .get('https://www.instagram.com/graphql/query/', {
      params: {
        query_hash: 'e769aa130647d2354c40ea6a439bfc08',
        variables: { id: id, first: 50, after: lastPost }
      }
    })
    .then(async response => {
      // handle success
      console.log(
        'The IG User Id is:',
        get(response, 'data.data.user.edge_owner_to_timeline_media.edges')
      )
      const hasNextPage = get(
        response,
        'data.data.user.edge_owner_to_timeline_media.page_info.has_next_page',
        false
      )

      const results = get(
        response,
        'data.data.user.edge_owner_to_timeline_media.edges',
        []
      )

      if (hasNextPage) {
        const lastPage = get(
          response,
          'data.data.user.edge_owner_to_timeline_media.page_info.end_cursor'
        )
        return results.concat(await getAllPosts(id, lastPage))
      } else {
        return results
      }
    })
    .catch(function(error) {
      // handle error
      console.log(error)
    })
}

const extractLocations = async list => {
  return await list.reduce((acc, item) => {
    const location = get(item, 'node.location', false)
    if (location) {
      return acc.concat(location)
    }
    return acc
  }, [])
}

const getLatLng = async locations => {
  // TODO: fix this. Rebuild it into Promisestyle. Not working atm
  return await locations.map(async (item, index) => {
    return await axios
      .get(
        `https://www.instagram.com/explore/locations/${item.id}/${item.slug}/?__a=1`
      )
      .then(json => {
        console.log('extract lat and lng')
        console.log(json)
        return json
      })
  })
}

getId('kevadams') //kevadams is the perfect test accout because he tags almost every image with a geolocation
  .then(id => getAllPosts(id))
  .then(list => {
    list = list.slice(0, 10) //TODO: this limit should get removed when going live
    console.log(list)
    return extractLocations(list)
  })
  .then(locations => {
    getLatLng(locations)
  })
  .then(geos => {
    console.log(geos)
  })
