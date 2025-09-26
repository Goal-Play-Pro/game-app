import { ShopController } from './shop.controller';

const mockShopService = () => ({
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  getProductVariants: jest.fn(),
});

describe('ShopController', () => {
  let controller: ShopController;
  let service: ReturnType<typeof mockShopService>;

  beforeEach(() => {
    service = mockShopService();
    controller = new ShopController(service as any);
  });

  it('delegates getProducts to ShopService', async () => {
    service.getProducts.mockResolvedValue(['p1']);
    const result = await controller.getProducts();
    expect(service.getProducts).toHaveBeenCalled();
    expect(result).toEqual(['p1']);
  });

  it('delegates getProductById to ShopService', async () => {
    service.getProductById.mockResolvedValue({ id: 'prod-1' });
    const result = await controller.getProductById('prod-1');
    expect(service.getProductById).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual({ id: 'prod-1' });
  });

  it('delegates getProductVariants to ShopService', async () => {
    service.getProductVariants.mockResolvedValue(['v1']);
    const result = await controller.getProductVariants('prod-1');
    expect(service.getProductVariants).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(['v1']);
  });
});
