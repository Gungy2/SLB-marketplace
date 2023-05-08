migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // remove
  collection.schema.removeField("1ind8qfk")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "1ind8qfk",
    "name": "exchange",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "9566dxf799fc6jx",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
})
