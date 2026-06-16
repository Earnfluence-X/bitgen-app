import { useStore } from '../../lib/store';
import { AnimatePresence, motion } from 'framer-motion';

export default function Toast() {
  const { toastMessage, toastType } = useStore();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          style={{
            borderColor: toastType === 'error'
              ? 'var(--red-border)'
              : toastType === 'info'
              ? 'var(--border-light)'
              : 'var(--green-border)',
          }}
        >
          {toastType === 'error' ? '[!] ' : toastType === 'info' ? '[i] ' : '[+] '}
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
