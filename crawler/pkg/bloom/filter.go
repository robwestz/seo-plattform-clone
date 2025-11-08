package bloom

import (
	"sync"

	"github.com/bits-and-blooms/bloom/v3"
	"go.uber.org/zap"
)

// URLFilter provides URL deduplication using Bloom filter
type URLFilter struct {
	filter *bloom.BloomFilter
	mu     sync.RWMutex
	logger *zap.Logger
}

// NewURLFilter creates a new URL filter
// n: expected number of elements
// fp: desired false positive rate (e.g., 0.01 for 1%)
func NewURLFilter(n uint, fp float64, logger *zap.Logger) *URLFilter {
	filter := bloom.NewWithEstimates(n, fp)

	logger.Info("created URL bloom filter",
		zap.Uint("capacity", n),
		zap.Float64("false_positive_rate", fp),
	)

	return &URLFilter{
		filter: filter,
		logger: logger,
	}
}

// Add adds a URL to the filter
func (uf *URLFilter) Add(url string) {
	uf.mu.Lock()
	defer uf.mu.Unlock()

	uf.filter.AddString(url)
}

// AddBatch adds multiple URLs to the filter
func (uf *URLFilter) AddBatch(urls []string) {
	uf.mu.Lock()
	defer uf.mu.Unlock()

	for _, url := range urls {
		uf.filter.AddString(url)
	}
}

// Contains checks if a URL might be in the filter
// Returns true if the URL is probably in the set (might be false positive)
// Returns false if the URL is definitely not in the set
func (uf *URLFilter) Contains(url string) bool {
	uf.mu.RLock()
	defer uf.mu.RUnlock()

	return uf.filter.TestString(url)
}

// ContainsOrAdd checks if a URL is in the filter and adds it if not
// Returns true if the URL was already in the filter
func (uf *URLFilter) ContainsOrAdd(url string) bool {
	uf.mu.Lock()
	defer uf.mu.Unlock()

	if uf.filter.TestString(url) {
		return true
	}

	uf.filter.AddString(url)
	return false
}

// Count returns the approximate number of elements in the filter
func (uf *URLFilter) Count() uint {
	uf.mu.RLock()
	defer uf.mu.RUnlock()

	return uf.filter.ApproximatedSize()
}

// Clear resets the filter
func (uf *URLFilter) Clear() {
	uf.mu.Lock()
	defer uf.mu.Unlock()

	uf.filter.ClearAll()

	uf.logger.Info("cleared URL bloom filter")
}

// Stats returns filter statistics
func (uf *URLFilter) Stats() FilterStats {
	uf.mu.RLock()
	defer uf.mu.RUnlock()

	return FilterStats{
		ApproximateCount: uf.filter.ApproximatedSize(),
		Capacity:         uf.filter.Cap(),
		FalsePositiveRate: uf.filter.EstimateFalsePositiveRate(
			uf.filter.ApproximatedSize(),
		),
	}
}

// FilterStats represents bloom filter statistics
type FilterStats struct {
	ApproximateCount  uint
	Capacity          uint
	FalsePositiveRate float64
}

// URLDeduplicator provides comprehensive URL deduplication
// Combines Bloom filter for quick checks with a backing store for accuracy
type URLDeduplicator struct {
	bloom  *URLFilter
	store  map[string]bool
	mu     sync.RWMutex
	logger *zap.Logger
}

// NewURLDeduplicator creates a new URL deduplicator
func NewURLDeduplicator(bloomCapacity uint, bloomFP float64, logger *zap.Logger) *URLDeduplicator {
	return &URLDeduplicator{
		bloom:  NewURLFilter(bloomCapacity, bloomFP, logger),
		store:  make(map[string]bool),
		logger: logger,
	}
}

// IsSeen checks if a URL has been seen before
func (ud *URLDeduplicator) IsSeen(url string) bool {
	// Quick check with Bloom filter first
	if !ud.bloom.Contains(url) {
		return false
	}

	// Verify with actual store to eliminate false positives
	ud.mu.RLock()
	defer ud.mu.RUnlock()

	return ud.store[url]
}

// MarkSeen marks a URL as seen
func (ud *URLDeduplicator) MarkSeen(url string) {
	ud.bloom.Add(url)

	ud.mu.Lock()
	defer ud.mu.Unlock()

	ud.store[url] = true
}

// MarkSeenBatch marks multiple URLs as seen
func (ud *URLDeduplicator) MarkSeenBatch(urls []string) {
	ud.bloom.AddBatch(urls)

	ud.mu.Lock()
	defer ud.mu.Unlock()

	for _, url := range urls {
		ud.store[url] = true
	}
}

// Count returns the exact number of seen URLs
func (ud *URLDeduplicator) Count() int {
	ud.mu.RLock()
	defer ud.mu.RUnlock()

	return len(ud.store)
}

// Clear resets both the Bloom filter and the store
func (ud *URLDeduplicator) Clear() {
	ud.bloom.Clear()

	ud.mu.Lock()
	defer ud.mu.Unlock()

	ud.store = make(map[string]bool)

	ud.logger.Info("cleared URL deduplicator")
}

// FilterUnseen filters a list of URLs to only include unseen ones
func (ud *URLDeduplicator) FilterUnseen(urls []string) []string {
	var unseen []string

	for _, url := range urls {
		if !ud.IsSeen(url) {
			unseen = append(unseen, url)
		}
	}

	return unseen
}

// Stats returns deduplicator statistics
func (ud *URLDeduplicator) Stats() DeduplicatorStats {
	bloomStats := ud.bloom.Stats()

	ud.mu.RLock()
	storeSize := len(ud.store)
	ud.mu.RUnlock()

	return DeduplicatorStats{
		StoreSize:         storeSize,
		BloomCount:        bloomStats.ApproximateCount,
		BloomCapacity:     bloomStats.Capacity,
		BloomFPRate:       bloomStats.FalsePositiveRate,
	}
}

// DeduplicatorStats represents deduplicator statistics
type DeduplicatorStats struct {
	StoreSize     int
	BloomCount    uint
	BloomCapacity uint
	BloomFPRate   float64
}
