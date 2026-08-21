import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Book, BookLink, RetailPlatform } from '../../types/database';
import { bookService } from '../../services/bookService';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../lib/utils';
import { RETAIL_PLATFORM_OPTIONS } from '../../constants/config';

export interface BookLinksModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookLinksModal: React.FC<BookLinksModalProps> = ({ book, isOpen, onClose }) => {
  const { success, error: toastError } = useToast();
  const [links, setLinks] = useState<BookLink[]>([]);
  const [loading, setLoading] = useState(false);

  // New Link form state
  const [platform, setPlatform] = useState<RetailPlatform>('Amazon');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [price, setPrice] = useState(250);
  const [currency, setCurrency] = useState('INR');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchLinks = async () => {
    if (!book) return;
    setLoading(true);
    try {
      const data = await bookService.getBookLinks(book.id);
      setLinks(data);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (book && isOpen) {
      fetchLinks();
    }
  }, [book, isOpen]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !affiliateUrl.trim()) return;

    setIsAdding(true);
    try {
      const created = await bookService.createBookLink({
        book_id: book.id,
        platform,
        affiliate_url: affiliateUrl.trim(),
        price: Number(price),
        currency,
        is_available: isAvailable,
      });

      setLinks((prev) => [...prev, created]);
      setAffiliateUrl('');
      setPrice(250);
      setIsAvailable(true);
      success('Link Added', `Added ${platform} purchase link in Supabase.`);
    } catch (err: any) {
      toastError('Add Failed', err.message || 'Could not add affiliate link.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await bookService.deleteBookLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      success('Link Removed', 'Affiliate link deleted from Supabase.');
    } catch (err: any) {
      toastError('Delete Failed', err.message);
    }
  };

  const handleToggleAvailable = async (link: BookLink) => {
    try {
      const nextStatus = !link.is_available;
      await bookService.updateBookLink(link.id, { is_available: nextStatus });
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_available: nextStatus } : l))
      );
      success('Stock Status Updated', `${link.platform} availability changed.`);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  if (!book) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Retailer Affiliate Links`}
      subtitle={`Book: ${book.title}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done & Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Existing Links List */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-dark-muted">
            Configured Retailers ({links.length})
          </span>

          {loading ? (
            <div className="p-4 text-center text-xs text-dark-muted">Loading links...</div>
          ) : links.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-background-elevated/40 border border-dark-border text-xs text-dark-dim">
              No store purchase links added yet for this book.
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-3.5 rounded-2xl bg-background-elevated/60 border border-dark-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="primary" size="sm">{link.platform}</Badge>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {formatCurrency(link.price, link.currency)}
                        </span>
                        <button
                          onClick={() => handleToggleAvailable(link)}
                          className="cursor-pointer"
                          title="Click to toggle in-stock"
                        >
                          <Badge variant={link.is_available ? 'success' : 'danger'} size="sm" dot>
                            {link.is_available ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </button>
                      </div>
                      <a
                        href={link.affiliate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-dark-muted hover:text-lavender-300 truncate max-w-xs block mt-0.5"
                      >
                        {link.affiliate_url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={link.affiliate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-dark-muted hover:text-lavender-300 hover:bg-lavender-500/10 rounded-lg transition-colors"
                      title="Open Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Link Form */}
        <form onSubmit={handleAddLink} className="p-4 rounded-2xl bg-background-elevated/40 border border-dark-border space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-lavender-400">
            + Add New Store / Retailer
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as RetailPlatform)}
              options={RETAIL_PLATFORM_OPTIONS}
            />

            <Input
              label="Retail Price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'INR (₹)' },
                { value: 'USD', label: 'USD ($)' },
              ]}
            />
          </div>

          <Input
            label="Affiliate / Store URL *"
            placeholder="https://amazon.in/dp/...?tag=cccprep-21"
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            required
          />

          <div className="flex items-center justify-between pt-1">
            <Switch
              checked={isAvailable}
              onChange={setIsAvailable}
              label="In Stock / Available"
            />
            <Button
              type="submit"
              size="sm"
              isLoading={isAdding}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Link
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
