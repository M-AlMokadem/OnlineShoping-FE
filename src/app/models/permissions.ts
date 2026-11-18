export const PERMISSIONS = {
  productsView: 'Products.View',
  productsCreate: 'Products.Create',
  productsEdit: 'Products.Edit',
  productsEditSku: 'Products.EditSku',
  productsPublish: 'Products.Publish',
  productsArchive: 'Products.Archive',
  categoriesManage: 'Categories.Manage',
  brandsManage: 'Brands.Manage',
  pricesUpdate: 'Prices.Update',
  stockUpdate: 'Stock.Update',
  usersManage: 'Users.Manage'
} as const;

export const STAFF_ROLES = ['CatalogueViewer', 'CatalogueEditor', 'InventoryManager', 'PricingManager', 'CatalogueApprover', 'Seller'] as const;
