migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("li6e7ucnz6ptadw")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fjgbwnpw",
    "name": "address",
    "type": "text",
    "required": true,
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
  const collection = dao.findCollectionByNameOrId("li6e7ucnz6ptadw")

  // remove
  collection.schema.removeField("fjgbwnpw")

  return dao.saveCollection(collection)
})
