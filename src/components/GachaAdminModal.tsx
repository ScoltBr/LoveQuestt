import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, X, Info } from 'lucide-react';
import { useLootPools, useAddLoot, useDeleteLoot, RewardType, ChestRarity } from '../hooks/useGacha';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GachaAdminModal({ isOpen, onClose }: Props) {
  const { data: lootPools, isLoading } = useLootPools();
  const addLoot = useAddLoot();
  const deleteLoot = useDeleteLoot();

  const [activeTab, setActiveTab] = useState<'weekly' | 'premium' | 'legendary'>('weekly');

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'xp' as RewardType,
    value: '',
    rarity: 'comum' as ChestRarity,
    chance: 10,
    emoji: '🎁'
  });

  if (!isOpen) return null;

  const currentItems = lootPools?.filter(item => (item as any).chest_type === activeTab) || [];
  const totalChance = currentItems.reduce((acc, curr) => acc + Number((curr as any).chance), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) return;

    await addLoot.mutateAsync({
      chest_type: activeTab,
      name: formData.name,
      type: formData.type,
      value: formData.type === 'xp' ? Number(formData.value) : formData.value,
      rarity: formData.rarity,
      chance: Number(formData.chance),
      emoji: formData.emoji
    });
    
    setIsAdding(false);
    setFormData({ ...formData, name: '', value: '' }); // reset some fields
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configurar Baús (Gacha)
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {(['weekly', 'premium', 'legendary'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab === 'weekly' ? 'Semanal' : tab === 'premium' ? 'Mágico' : 'Galático'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
            
            <div className={`p-3 rounded-lg mb-6 flex items-start gap-3 border ${totalChance === 100 ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' : 'bg-warning/10 border-warning/20 text-warning'}`}>
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">As chances de sorteio devem somar 100%.</p>
                <p className="text-xs opacity-80">Atualmente somam: {totalChance}% para este baú.</p>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 mb-8">
              {isLoading ? (
                <p className="text-slate-500 text-center py-4">Carregando...</p>
              ) : currentItems.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Nenhum prêmio configurado para este baú.</p>
              ) : (
                currentItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate text-sm">{item.reward_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          item.rarity === 'lendario' ? 'bg-yellow-500/20 text-yellow-500' :
                          item.rarity === 'incomum' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {item.reward_type === 'xp' ? `+ ${item.reward_value} XP` : `Voucher: ${item.reward_value}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 mr-4">
                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">{item.chance}%</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Deletar este prêmio?')) deleteLoot.mutate(item.id);
                      }}
                      className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Form */}
            {isAdding ? (
              <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <h4 className="font-bold text-white mb-2">Novo Item</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex gap-4">
                    <div className="w-16">
                      <label className="text-xs text-slate-400 block mb-1">Emoji</label>
                      <input 
                        type="text" 
                        value={formData.emoji} 
                        onChange={e => setFormData({...formData, emoji: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center" 
                        maxLength={2}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Nome do Prêmio</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
                        placeholder="Ex: Vale Massagem"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value as RewardType})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                    >
                      <option value="xp">Bônus de XP</option>
                      <option value="voucher">Voucher / Vale</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Valor (XP ou Texto)</label>
                    <input 
                      type={formData.type === 'xp' ? 'number' : 'text'}
                      required
                      value={formData.value} 
                      onChange={e => setFormData({...formData, value: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
                      placeholder={formData.type === 'xp' ? '500' : 'Descreva a ação...'}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Raridade</label>
                    <select 
                      value={formData.rarity} 
                      onChange={e => setFormData({...formData, rarity: e.target.value as ChestRarity})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                    >
                      <option value="comum">Comum</option>
                      <option value="incomum">Incomum (Épico)</option>
                      <option value="lendario">Lendário</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Chance (%)</label>
                    <input 
                      type="number"
                      required
                      min="1" max="100"
                      value={formData.chance} 
                      onChange={e => setFormData({...formData, chance: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-400 hover:bg-white/5 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={addLoot.isPending} className="flex-1 py-2 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50">
                    {addLoot.isPending ? 'Salvando...' : 'Salvar Prêmio'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-white/5 transition-all"
              >
                <Plus className="w-5 h-5" />
                Adicionar Novo Prêmio
              </button>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
