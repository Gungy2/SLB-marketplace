migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("xqvrfk7abq88609")

  collection.createRule = ""
  collection.deleteRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("xqvrfk7abq88609")

  collection.createRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
