import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Plus, X, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { CreateNFTData } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CreatePage = () => {
  const [formData, setFormData] = useState<CreateNFTData>({
    name: '',
    description: '',
    image: '',
    price: 0,
    currency: 'ETH',
    category: 'Art',
    tags: [],
    attributes: [],
    royalty: 5,
    blockchain: 'Ethereum'
  });

  const [dragActive, setDragActive] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const [previewImage, setPreviewImage] = useState<string>('');

  const createNFTMutation = useMutation({
    mutationFn: api.createNFT,
    onSuccess: () => {
      // Reset form or redirect
      setFormData({
        name: '',
        description: '',
        image: '',
        price: 0,
        currency: 'ETH',
        category: 'Art',
        tags: [],
        attributes: [],
        royalty: 5,
        blockchain: 'Ethereum'
      });
      setPreviewImage('');
    }
  });

  const categories = [
    'Art',
    'Gaming',
    'Music',
    'Photography',
    'Sports',
    'Collectibles',
    'Virtual Worlds',
    'Utility'
  ];

  const blockchains = [
    { name: 'Ethereum', symbol: 'ETH', fee: '~$50' },
    { name: 'Polygon', symbol: 'MATIC', fee: '~$0.01' },
    { name: 'BSC', symbol: 'BNB', fee: '~$1' },
    { name: 'Solana', symbol: 'SOL', fee: '~$0.01' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, image: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addAttribute = () => {
    if (newAttribute.trait_type.trim() && newAttribute.value.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }]
      }));
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNFTMutation.mutate(formData);
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
            Create NFT
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Turn your digital art into a unique NFT and share it with the world
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Image Upload */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Upload File *
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              File types supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF. Max size: 40 MB
            </p>

            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-neon-blue bg-neon-blue/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage('');
                      setFormData(prev => ({ ...prev, image: '' }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">
                    Drag and drop your file here, or{' '}
                    <label className="text-neon-blue cursor-pointer hover:text-neon-purple transition-colors">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,audio/*,.glb,.gltf"
                        onChange={handleFileInput}
                      />
                    </label>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input-field"
                  placeholder="Enter NFT name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full input-field"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full input-field resize-none"
                placeholder="Describe your NFT..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">
              Pricing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full input-field pr-20"
                    placeholder="0.00"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-white outline-none"
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Royalty (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.royalty}
                  onChange={(e) => setFormData(prev => ({ ...prev, royalty: parseInt(e.target.value) || 0 }))}
                  className="w-full input-field"
                  placeholder="5"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Suggested: 5-10%. You'll receive this percentage of sales price each time your NFT is sold.
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">
              Blockchain
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blockchains.map(blockchain => (
                <label
                  key={blockchain.name}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.blockchain === blockchain.name
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="blockchain"
                    value={blockchain.name}
                    checked={formData.blockchain === blockchain.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, blockchain: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {blockchain.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      Minting fee: {blockchain.fee}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Tags
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Add tags to help people discover your NFT
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center space-x-2 px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-neon-blue hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 input-field"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Attributes */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Attributes
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Add attributes to make your NFT more discoverable and valuable
            </p>

            {formData.attributes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {formData.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 glass rounded-lg"
                  >
                    <div>
                      <div className="text-sm text-gray-400">{attr.trait_type}</div>
                      <div className="text-white font-medium">{attr.value}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newAttribute.trait_type}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, trait_type: e.target.value }))}
                className="input-field"
                placeholder="Trait type (e.g., Color)"
              />
              <input
                type="text"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                className="input-field"
                placeholder="Value (e.g., Blue)"
              />
              <button
                type="button"
                onClick={addAttribute}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              className="btn-outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={createNFTMutation.isPending || !formData.name || !formData.image}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createNFTMutation.isPending ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>Create NFT</span>
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="glass rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="mb-2">
                <strong className="text-white">Important:</strong> Once you create your NFT, you won't be able to change the image, name, or description.
              </p>
              <p>
                Make sure all information is correct before minting. Gas fees will apply based on the selected blockchain.
              </p>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreatePage;