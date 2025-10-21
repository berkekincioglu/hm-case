import type { NextRequest } from "next/server";

import { coinRepository } from "@/lib/modules/coin/coin.repository";
import { coinGeckoService } from "@/lib/modules/coingecko/coingecko.service";
import { logger } from "@/lib/utils/logger";
import { ApiResponse } from "@/lib/utils/response";

/**
 * GET /api/coins/[id]/metadata
 *
 * Fetches metadata for a specific coin (description, image, website).
 * If metadata doesn't exist in database, fetches from CoinGecko and stores it.
 *
 * This endpoint is used for hoverable tooltips in the frontend.
 *
 * @param id - Coin ID (e.g., "bitcoin", "ethereum")
 *
 * Response:
 * - 200: Coin metadata
 * - 404: Coin not found
 * - 500: Server error
 *
 * Example:
 * - /api/coins/bitcoin/metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coinId } = await params;

    // Check if coin exists
    const coin = await coinRepository.findById(coinId);
    if (!coin) {
      return ApiResponse.notFound(`Coin '${coinId}' not found`);
    }

    // Try to get metadata from database first
    let metadata = await coinRepository.getMetadata(coinId);

    // If metadata doesn't exist, fetch from CoinGecko and store
    if (!metadata) {
      logger.info(
        `Metadata not found for ${coinId}, fetching from CoinGecko...`
      );

      try {
        const coinDetail = await coinGeckoService.getCoinDetail(coinId);

        // Extract metadata
        const metadataData = {
          coinId,
          description: coinDetail.description?.en || null,
          imageUrl: coinDetail.image?.large || null,
          homepageUrl: coinDetail.links?.homepage?.[0] || null,
        };

        // Store in database
        metadata = await coinRepository.upsertMetadata(metadataData);
        logger.success(`Stored metadata for ${coinId}`);
      } catch (error) {
        logger.error(
          `Failed to fetch metadata from CoinGecko for ${coinId}`,
          error
        );
        // Return empty metadata instead of failing
        return ApiResponse.success({
          coinId,
          name: coin.name,
          symbol: coin.symbol,
          description: null,
          imageUrl: null,
          homepageUrl: null,
        });
      }
    }

    return ApiResponse.success({
      coinId: metadata.coinId,
      name: coin.name,
      symbol: coin.symbol,
      description: metadata.description,
      imageUrl: metadata.imageUrl,
      homepageUrl: metadata.homepageUrl,
    });
  } catch (error) {
    const { id } = await params;
    logger.error(`Failed to fetch metadata for coin: ${id}`, error);
    return ApiResponse.error("Failed to fetch coin metadata", 500, error);
  }
}
