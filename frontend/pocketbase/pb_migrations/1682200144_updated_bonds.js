migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9xrtwj1m",
    "name": "current_period",
    "type": "number",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ujqzhgie",
    "name": "periods",
    "type": "number",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xpicj8eu",
    "name": "exchange",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": "^0x[a-fA-F0-9]{40}$"
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // remove
  collection.schema.removeField("9xrtwj1m")

  // remove
  collection.schema.removeField("ujqzhgie")

  // remove
  collection.schema.removeField("xpicj8eu")

  return dao.saveCollection(collection)
})
