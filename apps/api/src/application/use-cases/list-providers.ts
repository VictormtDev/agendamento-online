import type { Page, Pagination } from '../pagination.js';
import type { ProviderSummary, UserRepository } from '../ports/user-repository.js';

export class ListProviders {
  constructor(private readonly userRepository: UserRepository) {}

  // Providers with nothing active to book are left out: a client could not book with them.
  async execute(input: Pagination): Promise<Page<ProviderSummary>> {
    const { items, total } = await this.userRepository.listBookableProviders(input);
    return { data: items, meta: { page: input.page, perPage: input.perPage, total } };
  }
}
